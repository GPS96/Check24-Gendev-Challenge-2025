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

  // ✨ NEW: Export functionality
  const exportResults = (format: 'csv' | 'json') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `internet-comparison-${timestamp}`;
    
    if (format === 'csv') {
      const csvHeader = 'Provider,Status,Offers,Response Time (ms),Error\n';
      const csvData = results.providers.map(p => 
        `"${p.provider}","${p.success ? 'Success' : 'Failed'}","${p.offers.length}","${p.responseTime}","${p.error || ''}"`
      ).join('\n');
      
      const csvContent = csvHeader + csvData;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      const jsonContent = JSON.stringify(results, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Provider Status Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold dark:text-white mb-2">Search Results</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Found {results.totalOffers} offers from {results.providers.length} providers
            </p>
          </div>
          
          {/* ✨ NEW: Export Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleShare}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              📤 Share
            </button>
            
            <button
              onClick={() => exportResults('csv')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
              title="Export as CSV"
            >
              📊 CSV
            </button>
            
            <button
              onClick={() => exportResults('json')}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center"
              title="Export as JSON"
            >
              💾 JSON
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.providers.map((provider) => (
            <div key={provider.provider} className={`p-3 rounded border ${provider.success ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700'}`}>
              <div className="font-medium dark:text-white">{provider.provider}</div>
              <div className={`text-sm ${provider.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
            >
              <option value="speed">Speed (Mbps)</option>
              <option value="price">Monthly Price</option>
              <option value="provider">Provider</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order</label>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 bg-white hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
            >
              <option value="all">All Providers</option>
              <option value="WebWunder">WebWunder</option>
              <option value="ByteMe">ByteMe</option>
              <option value="PingPerfect">PingPerfect</option>
              <option value="VerbynDich">VerbynDich</option>
              <option value="ServusSpeed">ServusSpeed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Speed (Mbps)</label>
            <input
              type="number"
              value={minSpeed}
              onChange={(e) => setMinSpeed(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 w-24"
              min="0"
            />
          </div>
        </div>

        {/* Offers Display */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Available Offers ({filteredAndSortedOffers.length})</h3>
          
          {filteredAndSortedOffers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No offers available yet.</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                {allOffers.length === 0 
                  ? "Please try different search criteria or check back later" 
                  : "Try adjusting your filters to see more results."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAndSortedOffers.map((offer, index) => (
                <div key={`${offer.provider}-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-lg dark:text-white">{offer.productName}</h4>
                      <p className="text-gray-600 dark:text-gray-300">{offer.provider}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{offer.speed} Mbps</span>
                          <span className="text-gray-500">•</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            €{(offer.monthlyCost / 100).toFixed(2)}/month
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
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
    </div>
  );
};
