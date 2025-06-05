import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface SearchQuery {
  street: string;
  houseNumber: string;
  city: string;
  postalCode: string;
}

export interface InternetOffer {
  id: string;
  provider: string;
  productName: string;
  speed: number;
  monthlyCost: number;
  afterTwoYearsCost?: number;
  duration: number;
  connectionType: string;
  installationService: boolean;
  tvIncluded: boolean;
}

export interface ProviderResponse {
  provider: string;
  success: boolean;
  offers: InternetOffer[];
  error?: string;
  responseTime: number;
}

export interface ComparisonResult {
  query: SearchQuery;
  providers: ProviderResponse[];
  totalOffers: number;
  timestamp: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds to allow for provider retries
});

export const searchProviders = async (query: SearchQuery): Promise<ComparisonResult> => {
  const response = await api.post('/providers/compare', query);
  return response.data;
};

export const healthCheck = async () => {
  const response = await api.get('/providers/test');
  return response.data;
};
