import { BaseProviderService } from '../BaseProviderService';
import { SearchQuery, InternetOffer } from '../../models/InternetOffer';
import axios from 'axios';
import xml2js from 'xml2js';

export class WebWunderService extends BaseProviderService {
  private apiKey = process.env.WEBWUNDER_API_KEY!;
  private wsdlUrl = 'https://webwunder.gendev7.check24.fun/endpunkte/soap/ws/getInternetOffers.wsdl';

  getProviderName(): string {
    return 'WebWunder';
  }

  async fetchOffers(query: SearchQuery): Promise<InternetOffer[]> {
    const soapBody = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:gs="http://webwunder.gendev7.check24.fun/offerservice">
        <soapenv:Header/>
        <soapenv:Body>
          <gs:legacyGetInternetOffers>
            <gs:input>
              <gs:installation>true</gs:installation>
              <gs:connectionEnum>DSL</gs:connectionEnum>
              <gs:address>
                <gs:street>${query.street}</gs:street>
                <gs:houseNumber>${query.houseNumber}</gs:houseNumber>
                <gs:city>${query.city}</gs:city>
                <gs:plz>${query.postalCode}</gs:plz>
                <gs:countryCode>DE</gs:countryCode>
              </gs:address>
            </gs:input>
          </gs:legacyGetInternetOffers>
        </soapenv:Body>
      </soapenv:Envelope>
    `;

    const response = await axios.post(this.wsdlUrl, soapBody, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'X-Api-Key': this.apiKey,
        'SOAPAction': ''
      },
      timeout: this.timeout
    });

    return this.parseWebWunderResponse(response.data);
  }

  private async parseWebWunderResponse(xmlData: string): Promise<InternetOffer[]> {
    try {
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlData);
      
      const offers: InternetOffer[] = [];
      
      // Navigate through SOAP response structure
      const soapBody = result?.['soap:Envelope']?.['soap:Body'] || result?.['soapenv:Envelope']?.['soapenv:Body'];
      const responseData = soapBody?.['ns2:legacyGetInternetOffersResponse'] || soapBody?.['legacyGetInternetOffersResponse'];
      const returnData = responseData?.return;
      
      if (returnData && returnData.offers) {
        const offersList = Array.isArray(returnData.offers) ? returnData.offers : [returnData.offers];
        
        for (const offer of offersList) {
          const internetOffer: InternetOffer = {
            id: `webwunder-${offer.id || Math.random().toString(36).substring(7)}`,
            provider: 'WebWunder',
            productName: offer.productName || offer.name || 'WebWunder Internet',
            speed: parseInt(offer.speed) || parseInt(offer.downloadSpeed) || 0,
            monthlyCost: parseInt(offer.monthlyCost) || parseInt(offer.price) || 0,
            afterTwoYearsCost: offer.afterTwoYearsCost ? parseInt(offer.afterTwoYearsCost) : undefined,
            duration: parseInt(offer.duration) || parseInt(offer.contractDuration) || 24,
            connectionType: offer.connectionType || offer.technology || 'DSL',
            installationService: Boolean(offer.installationService || offer.installation),
            tvIncluded: Boolean(offer.tvIncluded || offer.tv),
            limitFrom: offer.limitFrom ? parseInt(offer.limitFrom) : undefined,
            maxAge: offer.maxAge ? parseInt(offer.maxAge) : undefined,
            voucherType: offer.voucherType || undefined,
            voucherValue: offer.voucherValue ? parseInt(offer.voucherValue) : undefined,
            rawData: offer
          };
          
          offers.push(internetOffer);
        }
      }
      
      console.log(`WebWunder: Parsed ${offers.length} offers`);
      return offers;
      
    } catch (error) {
      console.error('WebWunder: XML parsing error:', error);
      console.log('WebWunder response preview:', xmlData.substring(0, 500));
      return [];
    }
  }
}
