import { BaseProviderService } from '../BaseProviderService';
import { SearchQuery, InternetOffer } from '../../models/InternetOffer';
import axios from 'axios';

export class ByteMeService extends BaseProviderService {
  private apiKey = process.env.BYTEME_API_KEY!;
  private baseUrl = 'https://byteme.gendev7.check24.fun/app/api/products/data';

  getProviderName(): string {
    return 'ByteMe';
  }

  async fetchOffers(query: SearchQuery): Promise<InternetOffer[]> {
    const axiosInstance = this.createAxiosInstance();

    const response = await axiosInstance.get(this.baseUrl, {
      params: {
        street: query.street,
        houseNumber: query.houseNumber,
        city: query.city,
        plz: query.postalCode
      },
      headers: {
        'X-Api-Key': this.apiKey  // ← FIXED: Was Authorization Bearer
      }
    });

    return this.parseByteMeResponse(response.data);
  }

  private parseByteMeResponse(csvData: string): InternetOffer[] {
    const lines = csvData.trim().split('\n');
    const offers: InternetOffer[] = [];
    const seenProductIds = new Set<string>(); // Handle duplicates as mentioned in docs

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const columns = this.parseCSVLine(line);

      if (columns.length >= 13) {
        const [
          productId, providerName, speed, monthlyCostInCent,
          afterTwoYearsMonthlyCost, durationInMonths, connectionType,
          installationService, tv, limitFrom, maxAge, voucherType, voucherValue
        ] = columns;

        // Skip duplicates (ByteMe sends duplicate offers as per docs)
        if (seenProductIds.has(productId)) {
          continue;
        }
        seenProductIds.add(productId);

        const offer: InternetOffer = {
          id: `byteme-${productId}`,
          provider: 'ByteMe',
          productName: `${providerName} ${speed}Mbps`,
          speed: parseInt(speed) || 0,
          monthlyCost: parseInt(monthlyCostInCent) || 0,
          afterTwoYearsCost: parseInt(afterTwoYearsMonthlyCost) || undefined,
          duration: parseInt(durationInMonths) || 24,
          connectionType: connectionType || 'Unknown',
          installationService: installationService === 'true',
          tvIncluded: tv === 'true',
          limitFrom: limitFrom ? parseInt(limitFrom) : undefined,
          maxAge: maxAge ? parseInt(maxAge) : undefined,
          voucherType: voucherType || undefined,
          voucherValue: voucherValue ? parseInt(voucherValue) : undefined,
          rawData: { csvLine: line }
        };

        offers.push(offer);
      }
    }

    console.log(`ByteMe: Parsed ${offers.length} offers (removed duplicates)`);
    return offers;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }
}
