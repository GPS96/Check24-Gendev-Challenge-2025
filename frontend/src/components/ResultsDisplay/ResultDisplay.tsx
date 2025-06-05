import React, { useState, useMemo } from 'react';
import { ComparisonResult, InternetOffer } from '../../services/api';

interface ResultsDisplayProps {
  results: ComparisonResult;
  onShare: (shareId: string) => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onShare }) => {
  const [sortBy, setSortBy] = useState<'speed' | 'price' | 'provider'>('speed');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [minSpeed, setMinSpeed] = useState<number>(0);

  // Get all successful offers
  const allOffers = useMemo(() => {
    return results.providers
      .filter(p => p.success && p.offers.length > 0)
      .flatMap(p => p.offers);
  }, [results]);

  // Apply filters and sorting
  const filteredAndSortedOffers = useMemo(() => {
    let filtered = allOffers.filter(offer => {
      const providerMatch = filterProvider === 'all' || offer.provider === filterProvider;
      const speedMatch = offer.speed >= minSpeed;
      return providerMatch && speedMatch;
    });

    // Sort offers
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'speed':
          comparison = a.speed - b.speed;
          break;
        case 'price':
          comparison = a.monthlyCost - b.monthlyCost;
          break;
        case 'provider':
          comparison = a.provider.localeCompare(b.provider);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allOffers, sortBy, sortOrder, filterProvider, minSpeed]);

  const handleShare = () => {
    const shareId = Math.random().toString(36).substring(7);
    localStorage.setItem(`search_${shareId}`, JSON.stringify(results));
    onShare(shareId);
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Provider Status Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Search Results</h2>
        <p className="text-gray-600 mb-4">
          Found {results.totalOffers} offers from {results.providers.length} providers
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.providers.map((provider) => (
            <div key={provider.provider} className={`p-3 rounded border ${provider.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="font-medium">{provider.provider}</div>
              <div className={`text-sm ${provider.success ? 'text-green-600' : 'text-red-600'}`}>
                {provider.success 
                  ? `✓ ${provider.offers.length} offers (${provider.responseTime}ms)`
                  : `✗ ${provider.error}`
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Sorting */}
      {allOffers.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="speed">Speed (Mbps)</option>
                <option value="price">Monthly Price</option>
                <option value="provider">Provider</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Providers</option>
                {Array.from(new Set(allOffers.map(o => o.provider))).map(provider => (

                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Speed (Mbps)</label>
              <input
                type="number"
                value={minSpeed}
                onChange={(e) => setMinSpeed(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 w-24"
                min="0"
              />
            </div>

            <div>
              <button
                onClick={handleShare}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mt-6"
              >
                📤 Share Results
              </button>
            </div>
          </div>

          {/* Offers Display */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Offers ({filteredAndSortedOffers.length})</h3>
            
            {filteredAndSortedOffers.length === 0 ? (
              <p className="text-gray-500">No offers match your current filters.</p>
            ) : (
              <div className="grid gap-4">
                {filteredAndSortedOffers.map((offer, index) => (
                  <div key={`${offer.provider}-${index}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-lg">{offer.productName}</h4>
                        <p className="text-gray-600">{offer.provider}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-blue-600">{offer.speed} Mbps</span>
                            <span className="text-gray-500">•</span>
                            <span className="font-semibold text-green-600">
                              €{(offer.monthlyCost / 100).toFixed(2)}/month
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {offer.connectionType} • {offer.duration} months
                            {offer.installationService && ' • Installation included'}
                            {offer.tvIncluded && ' • TV included'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
