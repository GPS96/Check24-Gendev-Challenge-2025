import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useLocation } from 'react-router-dom';
import { SearchForm } from './components/SearchForm/SearchForm';
import { ResultsDisplay } from './components/ResultsDisplay/ResultsDisplay';
import { searchProviders, ComparisonResult } from './services/api';

// Component for shared results
const SharedResults: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shareId) {
      const savedResults = localStorage.getItem(`search_${shareId}`);
      if (savedResults) {
        try {
          setResults(JSON.parse(savedResults));
        } catch (error) {
          console.error('Error parsing shared results:', error);
        }
      }
      setLoading(false);
    }
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold">Loading shared results...</h1>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Shared results not found</h1>
          <p className="text-gray-600 mb-6">This shared link may have expired or is invalid.</p>
          <a 
            href="/" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start New Search
          </a>
        </div>
      </div>
    );
  }

  const handleShare = (newShareId: string) => {
    const shareUrl = `${window.location.origin}/share/${newShareId}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`New share link copied: ${shareUrl}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Shared Search Results</h1>
          <p className="text-gray-600 mb-4">
            Search: {results.query.street} {results.query.houseNumber}, {results.query.city} {results.query.postalCode}
          </p>
          <a href="/" className="text-blue-600 hover:underline">← Start New Search</a>
        </div>
        <ResultsDisplay results={results} onShare={handleShare} />
      </div>
    </div>
  );
};

// Main search component
const MainApp: React.FC = () => {
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await searchProviders(query);
      setResults(result);
    } catch (err: any) {
      setError('Unable to search providers at the moment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = (shareId: string) => {
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Share link copied to clipboard!\n\n${shareUrl}\n\nSend this link to others to share your search results.`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        
        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {results && (
          <ResultsDisplay results={results} onShare={handleShare} />
        )}
      </div>
    </div>
  );
};

// App with Router
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/share/:shareId" element={<SharedResults />} />
      </Routes>
    </Router>
  );
}

export default App;
