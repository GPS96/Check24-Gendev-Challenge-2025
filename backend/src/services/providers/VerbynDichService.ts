import { BaseProviderService } from '../BaseProviderService';
import { SearchQuery, InternetOffer } from '../../models/InternetOffer';
import axios from 'axios';

export class VerbynDichService extends BaseProviderService {
  private apiKey = process.env.VERBYNDICH_API_KEY!;
  private baseUrl = 'https://verbyndich.gendev7.check24.fun/check24/data';

  getProviderName(): string {
    return 'VerbynDich';
  }

  async fetchOffers(query: SearchQuery): Promise<InternetOffer[]> {
    const axiosInstance = this.createAxiosInstance();
    const allOffers: InternetOffer[] = [];
    let page = 0;
    let hasMorePages = true;

    while (hasMorePages && page < 10) { // Safety limit
      try {
        const requestData = `${query.street};${query.houseNumber};${query.city};${query.postalCode}`;
        
        const response = await axiosInstance.post(this.baseUrl, requestData, {
          params: {
            apiKey: this.apiKey,
            page: page
          },
          headers: {
            'Content-Type': 'text/plain'
          }
        });

        const pageOffers = this.parseVerbynDichResponse(response.data);
        allOffers.push(...pageOffers);

        // Check if this is the last page based on response
        hasMorePages = response.data && response.data.last === false;
        page++;

      } catch (error) {
        console.error(`VerbynDich: Error fetching page ${page}:`, error);
        break;
      }
    }

    console.log(`VerbynDich: Total parsed ${allOffers.length} offers from ${page} pages`);
    return allOffers;
  }

  private parseVerbynDichResponse(data: any): InternetOffer[] {
    const offers: InternetOffer[] = [];

    try {
      // Handle both single response and array, and direct data or nested structure
      let products = [];
      
      if (Array.isArray(data)) {
        products = data;
      } else if (data && data.product) {
        products = Array.isArray(data.product) ? data.product : [data.product];
      } else if (data && typeof data === 'object') {
        products = [data];
      }

      for (const item of products) {
        // Skip invalid items
        if (!item || (item.valid === false) || !item.description) {
          continue;
        }

        try {
          const parsedData = this.extractDataFromDescription(item.description);
          
          const offer: InternetOffer = {
            id: `verbyndich-${item.id || Math.random().toString(36).substring(7)}`,
            provider: 'VerbynDich',
            productName: parsedData.name || item.product || 'VerbynDich Internet',
            speed: parsedData.speed || 0,
            monthlyCost: parsedData.monthlyCost || 0,
            afterTwoYearsCost: parsedData.afterTwoYearsCost,
            duration: parsedData.duration || 24,
            connectionType: parsedData.connectionType || 'Unknown',
            installationService: parsedData.installationService || false,
            tvIncluded: parsedData.tvIncluded || false,
            limitFrom: parsedData.limitFrom,
            maxAge: parsedData.maxAge,
            voucherType: parsedData.voucherType,
            voucherValue: parsedData.voucherValue,
            rawData: { description: item.description, fullItem: item }
          };

          offers.push(offer);
        } catch (parseError) {
          console.error('VerbynDich: Error parsing individual product:', parseError);
        }
      }
    } catch (error) {
      console.error('VerbynDich: Error parsing response structure:', error);
      console.log('VerbynDich response preview:', JSON.stringify(data).substring(0, 200));
    }

    return offers;
  }

  private extractDataFromDescription(description: string): any {
    const result: any = {};

    try {
      // Extract speed (e.g., "50 Mbps", "100Mbps", "1 Gbit")
      const speedMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:Mbps|Mbit|Gbit|MB\/s)/i);
      if (speedMatch) {
        let speed = parseFloat(speedMatch[1]);
        if (description.toLowerCase().includes('gbit')) {
          speed *= 1000; // Convert Gbit to Mbps
        }
        result.speed = speed;
      }

      // Extract monthly cost (e.g., "29.99€", "€39,90", "45 Euro")
      const costMatch = description.match(/(?:€\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:€|Euro|EUR)/i);
      if (costMatch) {
        const cost = parseFloat(costMatch[1].replace(',', '.'));
        result.monthlyCost = Math.round(cost * 100); // Convert to cents
      }

      // Extract connection type
      if (/dsl/i.test(description)) {
        result.connectionType = 'DSL';
      } else if (/cable|kabel/i.test(description)) {
        result.connectionType = 'Cable';
      } else if (/fiber|glasfaser|fibre/i.test(description)) {
        result.connectionType = 'Fiber';
      } else if (/lte|5g|mobile/i.test(description)) {
        result.connectionType = 'Mobile';
      }

      // Extract installation service
      result.installationService = /installation|setup|anschluss/i.test(description);

      // Extract TV inclusion
      result.tvIncluded = /tv|television|fernsehen/i.test(description);

      // Extract contract duration
      const durationMatch = description.match(/(\d+)\s*(?:month|monate|jahre?|year)/i);
      if (durationMatch) {
        let duration = parseInt(durationMatch[1]);
        if (/jahr|year/i.test(description)) {
          duration *= 12; // Convert years to months
        }
        result.duration = duration;
      }

      // Extract product name (first meaningful part of description)
      const nameMatch = description.match(/^([^,.\n]+)/);
      if (nameMatch) {
        result.name = nameMatch[1].trim().substring(0, 50); // Limit length
      }

    } catch (error) {
      console.error('VerbynDich: Error extracting data from description:', error);
    }

    return result;
  }
}
