import { SearchQuery } from './api';

const LAST_SEARCH_KEY = 'lastSearch';
const SEARCH_HISTORY_KEY = 'searchHistory';

export interface SearchHistory {
  query: SearchQuery;
  timestamp: string;
}

export const saveLastSearch = (query: SearchQuery): void => {
  try {
    localStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(query));
    
    // Also add to search history
    const history = getSearchHistory();
    const newEntry: SearchHistory = {
      query,
      timestamp: new Date().toISOString()
    };
    
    // Add to beginning and keep only last 5 searches
    const updatedHistory = [newEntry, ...history.filter(h => 
      !(h.query.street === query.street && 
        h.query.houseNumber === query.houseNumber && 
        h.query.city === query.city && 
        h.query.postalCode === query.postalCode)
    )].slice(0, 5);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error saving search to session:', error);
  }
};

export const getLastSearch = (): SearchQuery | null => {
  try {
    const saved = localStorage.getItem(LAST_SEARCH_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading last search:', error);
    return null;
  }
};

export const getSearchHistory = (): SearchHistory[] => {
  try {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading search history:', error);
    return [];
  }
};

export const clearSearchHistory = (): void => {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    localStorage.removeItem(LAST_SEARCH_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
};
