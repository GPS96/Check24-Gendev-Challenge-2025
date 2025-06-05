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
  speed: number; // in Mbps
  monthlyCost: number; // in cents
  afterTwoYearsCost?: number; // in cents
  duration: number; // in months
  connectionType: string;
  installationService: boolean;
  tvIncluded: boolean;
  limitFrom?: number;
  maxAge?: number;
  voucherType?: string;
  voucherValue?: number;
  rawData?: any; // Store original response for debugging
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
  shareId?: string;
}
