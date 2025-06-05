import { BaseProviderService } from '../BaseProviderService';
import { SearchQuery, InternetOffer } from '../../models/InternetOffer';
import axios from 'axios';

export class ServusSpeedService extends BaseProviderService {
  private username = process.env.SERVUSSPEED_USERNAME!;
  private password = process.env.SERVUSSPEED_PASSWORD!;
  private baseUrl = 'https://servusspeed.gendev7.check24.fun/api/external';

  getProviderName(): string {
    return 'ServusSpeed';
  }

  async fetchOffers(query: SearchQuery): Promise<InternetOffer[]> {
    const axiosInstance = this.createAxiosInstance();
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');

    // Step 1: Get available products
    const availableProductsResponse = await axiosInstance.post(
      `${this.baseUrl}/available-products`,
      {
        street: query.street,
        houseNumber: query.houseNumber,
        city: query.city,
        postalCode: query.postalCode,
        countryCode: 'DE' // Only supports DE
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const availableProducts = availableProductsResponse.data;
    const offers: InternetOffer[] = [];

    // Step 2: Get details for each product
    if (availableProducts && availableProducts.productIds && Array.isArray(availableProducts.productIds)) {
      const detailPromises = availableProducts.productIds.map(async (productId: string) => {
        try {
          const detailResponse = await axiosInstance.get(
            `${this.baseUrl}/product-details/${productId}`,
            {
              headers: {
                'Authorization': `Basic ${auth}`
              }
            }
          );
          return this.parseServusSpeedProduct(detailResponse.data, productId);
        } catch (error) {
          console.error(`ServusSpeed: Error fetching details for product ${productId}:`, error);
          return null;
        }
      });

      const productDetails = await Promise.all(detailPromises);
      
      // Filter out failed requests and add to offers
      for (const product of productDetails) {
        if (product) {
          offers.push(product);
        }
      }
    }

    return offers;
  }

  private parseServusSpeedProduct(data: any, productId: string): InternetOffer {
    // Calculate final price after discount
    let finalMonthlyCost = data.monthlyCost || 0;
    if (data.discountInCents) {
      finalMonthlyCost = Math.max(0, finalMonthlyCost - data.discountInCents);
    }

    const offer: InternetOffer = {
      id: `servusspeed-${productId}`,
      provider: 'ServusSpeed',
      productName: data.name || data.productName || 'ServusSpeed Internet',
      speed: data.speed || data.downloadSpeed || 0,
      monthlyCost: finalMonthlyCost,
      afterTwoYearsCost: data.afterTwoYearsCost || undefined,
      duration: data.duration || data.contractDuration || 24,
      connectionType: data.connectionType || data.technology || 'Unknown',
      installationService: Boolean(data.installationService || data.installation),
      tvIncluded: Boolean(data.tvIncluded || data.tv),
      limitFrom: data.limitFrom || undefined,
      maxAge: data.maxAge || undefined,
      voucherType: data.voucherType || undefined,
      voucherValue: data.voucherValue || undefined,
      rawData: {
        originalData: data,
        originalMonthlyCost: data.monthlyCost,
        discountApplied: data.discountInCents || 0
      }
    };

    return offer;
  }
}
