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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServusSpeedService = void 0;
const BaseProviderService_1 = require("../BaseProviderService");
class ServusSpeedService extends BaseProviderService_1.BaseProviderService {
    constructor() {
        super(...arguments);
        this.username = process.env.SERVUSSPEED_USERNAME;
        this.password = process.env.SERVUSSPEED_PASSWORD;
        this.baseUrl = 'https://servusspeed.gendev7.check24.fun/api/external';
    }
    getProviderName() {
        return 'ServusSpeed';
    }
    fetchOffers(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const axiosInstance = this.createAxiosInstance();
            const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
            // Step 1: Get available products
            const availableProductsResponse = yield axiosInstance.post(`${this.baseUrl}/available-products`, {
                street: query.street,
                houseNumber: query.houseNumber,
                city: query.city,
                postalCode: query.postalCode,
                countryCode: 'DE' // Only supports DE
            }, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            });
            const availableProducts = availableProductsResponse.data;
            const offers = [];
            // Step 2: Get details for each product
            if (availableProducts && availableProducts.productIds && Array.isArray(availableProducts.productIds)) {
                const detailPromises = availableProducts.productIds.map((productId) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const detailResponse = yield axiosInstance.get(`${this.baseUrl}/product-details/${productId}`, {
                            headers: {
                                'Authorization': `Basic ${auth}`
                            }
                        });
                        return this.parseServusSpeedProduct(detailResponse.data, productId);
                    }
                    catch (error) {
                        console.error(`ServusSpeed: Error fetching details for product ${productId}:`, error);
                        return null;
                    }
                }));
                const productDetails = yield Promise.all(detailPromises);
                // Filter out failed requests and add to offers
                for (const product of productDetails) {
                    if (product) {
                        offers.push(product);
                    }
                }
            }
            return offers;
        });
    }
    parseServusSpeedProduct(data, productId) {
        // Calculate final price after discount
        let finalMonthlyCost = data.monthlyCost || 0;
        if (data.discountInCents) {
            finalMonthlyCost = Math.max(0, finalMonthlyCost - data.discountInCents);
        }
        const offer = {
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
exports.ServusSpeedService = ServusSpeedService;
