// Enhanced address service with comprehensive German postal code coverage
export interface AddressSuggestion {
  postalCode: string;
  city: string;
  state: string;
  displayName: string;
}

// Primary API: OpenPLZ (German postal code specialist)
const OPENPLZ_BASE = 'https://openplzapi.org/de';

// Secondary API: Nominatim (fallback)
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

export const searchGermanAddresses = async (query: string, type: 'city' | 'postal' = 'city'): Promise<AddressSuggestion[]> => {
  if (!query || query.length < 2) return [];
  
  // Try OpenPLZ API first (better for German addresses)
  try {
    let openplzUrl = '';
    
    if (type === 'postal') {
      // Search by postal code
      openplzUrl = `${OPENPLZ_BASE}/Localities?postalCode=${query}&page=1&pageSize=10`;
    } else {
      // Search by city name  
      openplzUrl = `${OPENPLZ_BASE}/Localities?name=${encodeURIComponent(query)}&page=1&pageSize=10`;
    }
    
    console.log(`Searching OpenPLZ for "${query}" (${type}):`, openplzUrl);
    
    const response = await fetch(openplzUrl);
    const data = await response.json();
    
    if (data && Array.isArray(data)) {
      const results = data.map((item: any) => ({
        postalCode: item.postalCode,
        city: item.name,
        state: item.federalState?.name || 'Germany',
        displayName: `${item.postalCode} - ${item.name}, ${item.federalState?.name || 'Germany'}`
      }));
      
      console.log(`OpenPLZ returned ${results.length} results for "${query}"`);
      return results;
    }
  } catch (error) {
    console.log('OpenPLZ API failed, trying Nominatim fallback:', error);
  }

  // Fallback to Nominatim
  try {
    let searchQuery = `${query}, Germany`;
    
    const response = await fetch(
      `${NOMINATIM_BASE}?` + new URLSearchParams({
        q: searchQuery,
        format: 'json',
        countrycodes: 'de',
        limit: '10',
        addressdetails: '1'
      })
    );
    
    const data = await response.json();
    
    const results = data
      .filter((item: any) => item.address?.postcode && item.address?.city)
      .map((item: any) => ({
        postalCode: item.address.postcode,
        city: item.address.city || item.address.town || item.address.village,
        state: item.address.state,
        displayName: `${item.address.postcode} - ${item.address.city || item.address.town}`
      }))
      .filter((item: AddressSuggestion, index: number, self: AddressSuggestion[]) => 
        index === self.findIndex((t: AddressSuggestion) => t.postalCode === item.postalCode && t.city === item.city)
      );
    
    console.log(`Nominatim returned ${results.length} results for "${query}"`);
    return results;
    
  } catch (error) {
    console.error('Both APIs failed:', error);
    return [];
  }
};

// Enhanced fallback data with München and Nürnberg examples
const FALLBACK_POSTAL_CODES: AddressSuggestion[] = [
  // München (multiple postal codes)
  { postalCode: '80331', city: 'München', state: 'Bayern', displayName: '80331 - München, Bayern' },
  { postalCode: '80333', city: 'München', state: 'Bayern', displayName: '80333 - München, Bayern' },
  { postalCode: '80335', city: 'München', state: 'Bayern', displayName: '80335 - München, Bayern' },
  { postalCode: '80337', city: 'München', state: 'Bayern', displayName: '80337 - München, Bayern' },
  { postalCode: '80469', city: 'München', state: 'Bayern', displayName: '80469 - München, Bayern' },
  { postalCode: '80636', city: 'München', state: 'Bayern', displayName: '80636 - München, Bayern' },
  { postalCode: '80637', city: 'München', state: 'Bayern', displayName: '80637 - München, Bayern' },
  { postalCode: '80638', city: 'München', state: 'Bayern', displayName: '80638 - München, Bayern' },
  { postalCode: '81675', city: 'München', state: 'Bayern', displayName: '81675 - München, Bayern' },
  { postalCode: '81677', city: 'München', state: 'Bayern', displayName: '81677 - München, Bayern' },
  
  // Nürnberg (multiple postal codes)
  { postalCode: '90402', city: 'Nürnberg', state: 'Bayern', displayName: '90402 - Nürnberg, Bayern' },
  { postalCode: '90403', city: 'Nürnberg', state: 'Bayern', displayName: '90403 - Nürnberg, Bayern' },
  { postalCode: '90408', city: 'Nürnberg', state: 'Bayern', displayName: '90408 - Nürnberg, Bayern' },
  { postalCode: '90409', city: 'Nürnberg', state: 'Bayern', displayName: '90409 - Nürnberg, Bayern' },
  { postalCode: '90411', city: 'Nürnberg', state: 'Bayern', displayName: '90411 - Nürnberg, Bayern' },
  { postalCode: '90419', city: 'Nürnberg', state: 'Bayern', displayName: '90419 - Nürnberg, Bayern' },
  { postalCode: '90425', city: 'Nürnberg', state: 'Bayern', displayName: '90425 - Nürnberg, Bayern' },
  { postalCode: '90427', city: 'Nürnberg', state: 'Bayern', displayName: '90427 - Nürnberg, Bayern' },
  { postalCode: '90429', city: 'Nürnberg', state: 'Bayern', displayName: '90429 - Nürnberg, Bayern' },
  { postalCode: '90431', city: 'Nürnberg', state: 'Bayern', displayName: '90431 - Nürnberg, Bayern' },
  
  // Other major cities
  { postalCode: '10115', city: 'Berlin', state: 'Berlin', displayName: '10115 - Berlin, Berlin' },
  { postalCode: '20095', city: 'Hamburg', state: 'Hamburg', displayName: '20095 - Hamburg, Hamburg' },
  { postalCode: '50667', city: 'Köln', state: 'Nordrhein-Westfalen', displayName: '50667 - Köln, NRW' },
  { postalCode: '60311', city: 'Frankfurt am Main', state: 'Hessen', displayName: '60311 - Frankfurt am Main, Hessen' },
  { postalCode: '91054', city: 'Erlangen', state: 'Bayern', displayName: '91054 - Erlangen, Bayern' }
];

export const searchPostalCodes = async (query: string): Promise<AddressSuggestion[]> => {
  console.log(`Searching postal codes for: "${query}"`);
  
  try {
    if (query.length >= 2) {
      const apiResults = await searchGermanAddresses(query, /^\d/.test(query) ? 'postal' : 'city');
      if (apiResults.length > 0) {
        console.log(`API success: ${apiResults.length} results`);
        return apiResults.slice(0, 8);
      }
    }
    
    // Enhanced fallback search
    const fallbackResults = FALLBACK_POSTAL_CODES.filter((item: AddressSuggestion) => 
      item.postalCode.startsWith(query) || 
      item.city.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
    
    console.log(`Using fallback: ${fallbackResults.length} results for "${query}"`);
    return fallbackResults;
    
  } catch (error) {
    console.error('Search failed completely, using fallback:', error);
    return FALLBACK_POSTAL_CODES.filter((item: AddressSuggestion) => 
      item.postalCode.startsWith(query) || 
      item.city.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }
};

export const getCityByPostalCode = async (postalCode: string): Promise<string | null> => {
  try {
    const results = await searchGermanAddresses(postalCode, 'postal');
    if (results.length > 0) {
      return results[0].city;
    }
    
    // Fallback
    const fallback = FALLBACK_POSTAL_CODES.find((item: AddressSuggestion) => item.postalCode === postalCode);
    return fallback ? fallback.city : null;
  } catch (error) {
    const fallback = FALLBACK_POSTAL_CODES.find((item: AddressSuggestion) => item.postalCode === postalCode);
    return fallback ? fallback.city : null;
  }
};

export const getPostalCodeByCity = async (city: string): Promise<string | null> => {
  try {
    const results = await searchGermanAddresses(city, 'city');
    if (results.length > 0) {
      return results[0].postalCode;
    }
    
    // Fallback
    const fallback = FALLBACK_POSTAL_CODES.find((item: AddressSuggestion) => 
      item.city.toLowerCase() === city.toLowerCase()
    );
    return fallback ? fallback.postalCode : null;
  } catch (error) {
    const fallback = FALLBACK_POSTAL_CODES.find((item: AddressSuggestion) => 
      item.city.toLowerCase() === city.toLowerCase()
    );
    return fallback ? fallback.postalCode : null;
  }
};
