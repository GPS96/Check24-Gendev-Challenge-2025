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
exports.ByteMeService = void 0;
const BaseProviderService_1 = require("../BaseProviderService");
class ByteMeService extends BaseProviderService_1.BaseProviderService {
    constructor() {
        super(...arguments);
        this.apiKey = process.env.BYTEME_API_KEY;
        this.baseUrl = 'https://byteme.gendev7.check24.fun/app/api/products/data';
    }
    getProviderName() {
        return 'ByteMe';
    }
    fetchOffers(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const axiosInstance = this.createAxiosInstance();
            const response = yield axiosInstance.get(this.baseUrl, {
                params: {
                    street: query.street,
                    houseNumber: query.houseNumber,
                    city: query.city,
                    plz: query.postalCode
                },
                headers: {
                    'X-Api-Key': this.apiKey // ← FIXED: Was Authorization Bearer
                }
            });
            return this.parseByteMeResponse(response.data);
        });
    }
    parseByteMeResponse(csvData) {
        const lines = csvData.trim().split('\n');
        const offers = [];
        const seenProductIds = new Set(); // Handle duplicates as mentioned in docs
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const columns = this.parseCSVLine(line);
            if (columns.length >= 13) {
                const [productId, providerName, speed, monthlyCostInCent, afterTwoYearsMonthlyCost, durationInMonths, connectionType, installationService, tv, limitFrom, maxAge, voucherType, voucherValue] = columns;
                // Skip duplicates (ByteMe sends duplicate offers as per docs)
                if (seenProductIds.has(productId)) {
                    continue;
                }
                seenProductIds.add(productId);
                const offer = {
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
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
}
exports.ByteMeService = ByteMeService;
