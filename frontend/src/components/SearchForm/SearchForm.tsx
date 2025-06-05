import React, { useState, useEffect, useRef } from 'react';
import { SearchQuery } from '../../services/api';
import { searchPostalCodes, getCityByPostalCode, getPostalCodeByCity, AddressSuggestion } from '../../services/addressService';
import { saveLastSearch, getLastSearch, getSearchHistory, SearchHistory } from '../../services/sessionService';

interface SearchFormProps {
  onSearch: (query: SearchQuery) => void;
  isLoading: boolean;
}

interface ValidationErrors {
  street?: string;
  houseNumber?: string;
  city?: string;
  postalCode?: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading }) => {
  const [formData, setFormData] = useState<SearchQuery>({
    street: '',
    houseNumber: '',
    city: '',
    postalCode: ''
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showValidation, setShowValidation] = useState(false);
  
  // Address autocompletion states
  const [postalSuggestions, setPostalSuggestions] = useState<AddressSuggestion[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<AddressSuggestion[]>([]);
  const [showPostalSuggestions, setShowPostalSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
  // Session state
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Loading progress state
  const [searchProgress, setSearchProgress] = useState(0);
  
  // ✨ NEW: Dark mode state
  const [darkMode, setDarkMode] = useState(false);
  
  const postalInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);

  // Load last search and history on component mount
  useEffect(() => {
    const lastSearch = getLastSearch();
    if (lastSearch) {
      setFormData(lastSearch);
    }
    setSearchHistory(getSearchHistory());
  }, []);

  // ✨ NEW: Load saved dark mode preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(JSON.parse(savedTheme));
    }
  }, []);

  // ✨ NEW: Apply dark mode to document
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // ✨ NEW: Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to search
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading) {
          const form = document.querySelector('form');
          if (form) {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
          }
        }
      }
      
      // Escape to clear form
      if (e.key === 'Escape') {
        setFormData({ street: '', houseNumber: '', city: '', postalCode: '' });
        setValidationErrors({});
        setShowValidation(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isLoading]);

  // Progress animation when searching
  useEffect(() => {
    if (isLoading) {
      setSearchProgress(0);
      const interval = setInterval(() => {
        setSearchProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);
      
      return () => clearInterval(interval);
    } else {
      setSearchProgress(100);
      setTimeout(() => setSearchProgress(0), 1000);
    }
  }, [isLoading]);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'street':
        if (value && /^\d{5}$/.test(value)) {
          return 'This looks like a postal code. Street names should contain letters.';
        }
        if (value && /^[0-9]+$/.test(value)) {
          return 'Street names should contain letters, not just numbers.';
        }
        break;

      case 'houseNumber':
        if (value && /^[xX]+$/.test(value)) {
          return 'Please enter a valid house number (e.g., 123, 45A).';
        }
        if (value && value.length > 0 && !/^[0-9]+[a-zA-Z]?$/.test(value)) {
          return 'House number should be numeric (e.g., 123, 45A).';
        }
        break;

      case 'city':
        if (value && /^\d{5}$/.test(value)) {
          return 'This looks like a postal code. Did you mean to enter a city name?';
        }
        if (value && /^[0-9]+$/.test(value)) {
          return 'City names should contain letters, not just numbers.';
        }
        if (value && value.length > 0 && !/^[a-zA-ZäöüÄÖÜß\s-]+$/.test(value)) {
          return 'City names should only contain letters and spaces.';
        }
        break;

      case 'postalCode':
        if (value && value.length > 0 && !/^\d{5}$/.test(value)) {
          return 'German postal codes should be exactly 5 digits (e.g., 80331).';
        }
        if (value && /^[a-zA-Z]+$/.test(value)) {
          return 'This looks like a city name. Postal codes should be 5 digits.';
        }
        break;
    }
    return undefined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);

    const errors: ValidationErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof SearchQuery]);
      if (error) {
        errors[key as keyof ValidationErrors] = error;
      }
    });

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      saveLastSearch(formData);
      setSearchHistory(getSearchHistory());
      onSearch(formData);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Address autocompletion with proper async/await
    if (name === 'postalCode' && value.length >= 2) {
      try {
        const suggestions = await searchPostalCodes(value);
        setPostalSuggestions(suggestions);
        setShowPostalSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Error fetching postal suggestions:', error);
        setShowPostalSuggestions(false);
      }
    } else if (name === 'postalCode') {
      setShowPostalSuggestions(false);
    }

    if (name === 'city' && value.length >= 2) {
      try {
        const suggestions = await searchPostalCodes(value);
        setCitySuggestions(suggestions);
        setShowCitySuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
        setShowCitySuggestions(false);
      }
    } else if (name === 'city') {
      setShowCitySuggestions(false);
    }

    // Real-time validation
    if (showValidation) {
      const error = validateField(name, value);
      setValidationErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handlePostalCodeSelect = (suggestion: AddressSuggestion) => {
    setFormData({
      ...formData,
      postalCode: suggestion.postalCode,
      city: suggestion.city
    });
    setShowPostalSuggestions(false);
  };

  const handleCitySelect = (suggestion: AddressSuggestion) => {
    setFormData({
      ...formData,
      city: suggestion.city,
      postalCode: suggestion.postalCode
    });
    setShowCitySuggestions(false);
  };

  const handleHistorySelect = (historyItem: SearchHistory) => {
    setFormData(historyItem.query);
    setShowHistory(false);
  };

  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Auto-fill city/postal code with proper async/await
    if (name === 'postalCode' && value.length === 5) {
      try {
        const city = await getCityByPostalCode(value);
        if (city && !formData.city) {
          setFormData(prev => ({ ...prev, city }));
        }
      } catch (error) {
        console.error('Error auto-filling city:', error);
      }
    }
    
    if (name === 'city' && value && !formData.postalCode) {
      try {
        const postalCode = await getPostalCodeByCity(value);
        if (postalCode) {
          setFormData(prev => ({ ...prev, postalCode }));
        }
      } catch (error) {
        console.error('Error auto-filling postal code:', error);
      }
    }

    // Validation
    const error = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));

    // Hide suggestions after a delay to allow clicks
    setTimeout(() => {
      setShowPostalSuggestions(false);
      setShowCitySuggestions(false);
      setPostalSuggestions([]);
      setCitySuggestions([]);
    }, 200);
  };

  return (
    <div className={`relative max-w-4xl mx-auto p-8 rounded-xl shadow-xl border transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
        : 'bg-gradient-to-br from-blue-50 to-white border-blue-100'
    }`}>
      
      {/* ✨ NEW: Dark Mode Toggle */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className={`p-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
            darkMode 
              ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* CHECK24-inspired header */}
      <div className="text-center mb-8">
        <h1 className={`text-4xl font-bold mb-3 ${
          darkMode 
            ? 'text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text' 
            : 'text-transparent bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text'
        }`}>
          🌐 Internet Provider Comparison
        </h1>
        <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Find the best internet deals in your area
        </p>
        <div className={`mt-2 flex justify-center items-center space-x-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <span className="flex items-center">✨ 16,000+ German cities</span>
          <span className="flex items-center">🚀 Real-time comparison</span>
          <span className="flex items-center">🔒 Secure & private</span>
        </div>
      </div>

      {/* Progress indicator during search */}
      {isLoading && (
        <div className={`mb-6 border rounded-lg p-4 ${
          darkMode 
            ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className={`animate-spin rounded-full h-5 w-5 border-b-2 mr-3 ${
                darkMode ? 'border-blue-400' : 'border-blue-600'
              }`}></div>
              <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                Comparing 5 providers...
              </span>
            </div>
            <span className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {Math.round(searchProgress)}%
            </span>
          </div>
          <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-600' : 'bg-blue-200'}`}>
            <div 
              className={`h-2 rounded-full transition-all duration-300 ease-out ${
                darkMode 
                  ? 'bg-gradient-to-r from-blue-400 to-purple-400' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}
              style={{ width: `${searchProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Search History with improved styling */}
      {searchHistory.length > 0 && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`inline-flex items-center text-sm font-medium hover:underline transition-colors ${
              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            <span className="mr-1">📝</span>
            {showHistory ? 'Hide' : 'Show'} recent searches ({searchHistory.length})
          </button>
          
          {showHistory && (
            <div className={`mt-3 rounded-lg p-4 border ${
              darkMode 
                ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600' 
                : 'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200'
            }`}>
              <div className="space-y-2">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleHistorySelect(item)}
                    className={`block w-full text-left text-sm p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                      darkMode 
                        ? 'hover:bg-gray-600 border-gray-600 text-gray-300 hover:text-blue-400 hover:border-blue-500' 
                        : 'hover:bg-white border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">
                      {item.query.street} {item.query.houseNumber}, {item.query.city} {item.query.postalCode}
                    </div>
                    <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      🕒 {new Date(item.timestamp).toLocaleDateString('de-DE')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="street" className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              🏠 Street
            </label>
            <input
              type="text"
              id="street"
              name="street"
              value={formData.street}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                validationErrors.street 
                  ? 'border-red-400 bg-red-50 dark:bg-red-900 dark:border-red-500' 
                  : darkMode 
                    ? 'border-gray-600 bg-gray-700 text-white hover:border-blue-400' 
                    : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder="Hauptstraße"
            />
            {validationErrors.street && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span className="mr-1">⚠️</span>
                {validationErrors.street}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="houseNumber" className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              🔢 House Number
            </label>
            <input
              type="text"
              id="houseNumber"
              name="houseNumber"
              value={formData.houseNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                validationErrors.houseNumber 
                  ? 'border-red-400 bg-red-50 dark:bg-red-900 dark:border-red-500' 
                  : darkMode 
                    ? 'border-gray-600 bg-gray-700 text-white hover:border-blue-400' 
                    : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder="123"
            />
            {validationErrors.houseNumber && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span className="mr-1">⚠️</span>
                {validationErrors.houseNumber}
              </p>
            )}
          </div>
          
          <div className="relative">
            <label htmlFor="city" className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              🏙️ City
            </label>
            <input
              ref={cityInputRef}
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                validationErrors.city 
                  ? 'border-red-400 bg-red-50 dark:bg-red-900 dark:border-red-500' 
                  : darkMode 
                    ? 'border-gray-600 bg-gray-700 text-white hover:border-blue-400' 
                    : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder="München"
            />
            
            {/* Enhanced City Suggestions */}
            {showCitySuggestions && (
              <div className={`absolute z-20 w-full border-2 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-xl ${
                darkMode 
                  ? 'bg-gray-800 border-blue-500' 
                  : 'bg-white border-blue-300'
              }`}>
                {citySuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleCitySelect(suggestion)}
                    className={`w-full text-left px-4 py-3 text-sm border-b last:border-b-0 transition-colors ${
                      darkMode 
                        ? 'hover:bg-gray-700 focus:bg-gray-700 border-gray-600' 
                        : 'hover:bg-blue-50 focus:bg-blue-50 border-gray-100'
                    }`}
                  >
                    <div className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {suggestion.city}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {suggestion.postalCode} • {suggestion.state}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {validationErrors.city && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span className="mr-1">⚠️</span>
                {validationErrors.city}
              </p>
            )}
          </div>
          
          <div className="relative">
            <label htmlFor="postalCode" className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              📮 Postal Code
            </label>
            <input
              ref={postalInputRef}
              type="text"
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                validationErrors.postalCode 
                  ? 'border-red-400 bg-red-50 dark:bg-red-900 dark:border-red-500' 
                  : darkMode 
                    ? 'border-gray-600 bg-gray-700 text-white hover:border-blue-400' 
                    : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder="80331"
            />
            
            {/* Enhanced Postal Code Suggestions */}
            {showPostalSuggestions && (
              <div className={`absolute z-20 w-full border-2 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-xl ${
                darkMode 
                  ? 'bg-gray-800 border-blue-500' 
                  : 'bg-white border-blue-300'
              }`}>
                {postalSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePostalCodeSelect(suggestion)}
                    className={`w-full text-left px-4 py-3 text-sm border-b last:border-b-0 transition-colors ${
                      darkMode 
                        ? 'hover:bg-gray-700 focus:bg-gray-700 border-gray-600' 
                        : 'hover:bg-blue-50 focus:bg-blue-50 border-gray-100'
                    }`}
                  >
                    <div className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {suggestion.postalCode} - {suggestion.city}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {suggestion.state}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {validationErrors.postalCode && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span className="mr-1">⚠️</span>
                {validationErrors.postalCode}
              </p>
            )}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none ${
            darkMode 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500'
          } disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Searching Providers...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              🔍 Compare Internet Providers
            </span>
          )}
        </button>
      </form>

      {/* ✨ NEW: Keyboard Shortcuts Info */}
      <div className={`mt-6 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <span className="inline-flex items-center space-x-4">
          <span className="flex items-center">
            💡 <kbd className={`px-2 py-1 ml-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>Ctrl+Enter</kbd> to search
          </span>
          <span className="flex items-center">
            <kbd className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>Esc</kbd> to clear
          </span>
        </span>
      </div>
    </div>
  );
};
