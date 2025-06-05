import axios, { AxiosResponse } from 'axios';
import { SearchQuery, InternetOffer, ProviderResponse } from '../models/InternetOffer';

export abstract class BaseProviderService {
  protected timeout = 10000;
  protected maxRetries = 3;

  abstract getProviderName(): string;
  abstract fetchOffers(query: SearchQuery): Promise<InternetOffer[]>;

  async getOffersWithRetry(query: SearchQuery): Promise<ProviderResponse> {
    const startTime = Date.now();
    let lastError: string = '';

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`${this.getProviderName()}: Attempt ${attempt}/${this.maxRetries}`);
        
        const offers = await this.fetchOffers(query);
        const responseTime = Date.now() - startTime;

        return {
          provider: this.getProviderName(),
          success: true,
          offers,
          responseTime
        };

      } catch (error: any) {
        lastError = this.getUserFriendlyError(error);
        console.log(`${this.getProviderName()}: Attempt ${attempt} failed - ${error.message}`);
        
        if (attempt < this.maxRetries) {
          await this.delay(1000 * attempt);
        }
      }
    }

    return {
      provider: this.getProviderName(),
      success: false,
      offers: [],
      error: lastError,
      responseTime: Date.now() - startTime
    };
  }

  // Convert technical errors to user-friendly messages
  private getUserFriendlyError(error: any): string {
    const provider = this.getProviderName();
    
    // Network/Connection errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return `${provider} is temporarily unavailable`;
    }
    
    // Authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return `${provider} service is currently unavailable`;
    }
    
    // Server errors
    if (error.response?.status >= 500) {
      return `${provider} is experiencing technical difficulties`;
    }
    
    // Rate limiting
    if (error.response?.status === 429) {
      return `${provider} is busy, please try again later`;
    }
    
    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return `${provider} is responding slowly, please try again`;
    }
    
    // Crypto/Key errors (PingPerfect specific)
    if (error.message?.includes('key') || error.message?.includes('crypto')) {
      return `${provider} service is currently unavailable`;
    }
    
    // Generic fallback
    return `${provider} is temporarily unavailable`;
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected createAxiosInstance() {
    return axios.create({
      timeout: this.timeout,
      headers: {
        'User-Agent': 'CHECK24-Comparison-Tool/1.0'
      }
    });
  }
}
