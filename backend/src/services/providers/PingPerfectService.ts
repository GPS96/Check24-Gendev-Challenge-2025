import { BaseProviderService } from '../BaseProviderService';
import { SearchQuery, InternetOffer } from '../../models/InternetOffer';
import axios from 'axios';
import crypto from 'crypto';

export class PingPerfectService extends BaseProviderService {
  private clientId = process.env.PINGPERFECT_CLIENT_ID!;
  private secret = process.env.PINGPERFECT_SECRET!;
  private baseUrl = 'https://pingperfect.gendev7.check24.fun/api/external/offers';

  getProviderName(): string {
    return 'PingPerfect';
  }

  async fetchOffers(query: SearchQuery): Promise<InternetOffer[]> {
    const axiosInstance = this.createAxiosInstance();
    const timestamp = Math.floor(Date.now() / 1000).toString(); // Unix timestamp in seconds
    const requestData = JSON.stringify({
      street: query.street,
      houseNumber: query.houseNumber,
      city: query.city,
      postalCode: query.postalCode
    });

    // Generate HMAC-SHA256 signature with correct format from docs
    const signature = this.generateSignature(timestamp, requestData);

    const response = await axiosInstance.post(this.baseUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Timestamp': timestamp,
        'X-Client-Id': this.clientId
      }
    });

    return this.parsePingPerfectResponse(response.data);
  }

  private generateSignature(timestamp: string, data: string): string {
    // FIXED: Correct format from docs - timestamp:requestbody (NO clientId!)
    const message = `${timestamp}:${data}`;
    console.log(`PingPerfect: Signing message: ${message.substring(0, 100)}...`);
    return crypto
      .createHmac('sha256', this.secret)
      .update(message)
      .digest('hex');
  }

  private parsePingPerfectResponse(data: any): InternetOffer[] {
    const offers: InternetOffer[] = [];

    if (data && data.offers && Array.isArray(data.offers)) {
      for (const item of data.offers) {
        const offer: InternetOffer = {
          id: `pingperfect-${item.id || Math.random().toString(36).substring(7)}`,
          provider: 'PingPerfect',
          productName: item.name || item.productName || 'PingPerfect Internet',
          speed: item.speed || item.downloadSpeed || 0,
          monthlyCost: item.monthlyCost || item.price || 0,
          afterTwoYearsCost: item.afterTwoYearsCost || undefined,
          duration: item.duration || item.contractDuration || 24,
          connectionType: item.connectionType || item.technology || 'Unknown',
          installationService: Boolean(item.installationService || item.installation),
          tvIncluded: Boolean(item.tvIncluded || item.tv),
          limitFrom: item.limitFrom || undefined,
          maxAge: item.maxAge || undefined,
          voucherType: item.voucherType || undefined,
          voucherValue: item.voucherValue || undefined,
          rawData: item
        };

        offers.push(offer);
      }
    }

    console.log(`PingPerfect: Parsed ${offers.length} offers`);
    return offers;
  }
}
