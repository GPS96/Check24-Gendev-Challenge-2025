"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebWunderService = void 0;
const BaseProviderService_1 = require("../BaseProviderService");
const axios_1 = __importDefault(require("axios"));
const xml2js_1 = __importDefault(require("xml2js"));
class WebWunderService extends BaseProviderService_1.BaseProviderService {
    constructor() {
        super(...arguments);
        this.apiKey = process.env.WEBWUNDER_API_KEY;
        this.wsdlUrl = 'https://webwunder.gendev7.check24.fun/endpunkte/soap/ws/getInternetOffers.wsdl';
    }
    getProviderName() {
        return 'WebWunder';
    }
    fetchOffers(query) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const response = yield axios_1.default.post(this.wsdlUrl, soapBody, {
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'X-Api-Key': this.apiKey,
                    'SOAPAction': ''
                },
                timeout: this.timeout
            });
            return this.parseWebWunderResponse(response.data);
        });
    }
    parseWebWunderResponse(xmlData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const parser = new xml2js_1.default.Parser({ explicitArray: false });
                const result = yield parser.parseStringPromise(xmlData);
                const offers = [];
                // Navigate through SOAP response structure
                const soapBody = ((_a = result === null || result === void 0 ? void 0 : result['soap:Envelope']) === null || _a === void 0 ? void 0 : _a['soap:Body']) || ((_b = result === null || result === void 0 ? void 0 : result['soapenv:Envelope']) === null || _b === void 0 ? void 0 : _b['soapenv:Body']);
                const responseData = (soapBody === null || soapBody === void 0 ? void 0 : soapBody['ns2:legacyGetInternetOffersResponse']) || (soapBody === null || soapBody === void 0 ? void 0 : soapBody['legacyGetInternetOffersResponse']);
                const returnData = responseData === null || responseData === void 0 ? void 0 : responseData.return;
                if (returnData && returnData.offers) {
                    const offersList = Array.isArray(returnData.offers) ? returnData.offers : [returnData.offers];
                    for (const offer of offersList) {
                        const internetOffer = {
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
            }
            catch (error) {
                console.error('WebWunder: XML parsing error:', error);
                console.log('WebWunder response preview:', xmlData.substring(0, 500));
                return [];
            }
        });
    }
}
exports.WebWunderService = WebWunderService;
