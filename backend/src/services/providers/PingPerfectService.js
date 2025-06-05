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
exports.PingPerfectService = void 0;
const BaseProviderService_1 = require("../BaseProviderService");
const crypto_1 = __importDefault(require("crypto"));
class PingPerfectService extends BaseProviderService_1.BaseProviderService {
    constructor() {
        super(...arguments);
        this.clientId = process.env.PINGPERFECT_CLIENT_ID;
        this.secret = process.env.PINGPERFECT_SECRET;
        this.baseUrl = 'https://pingperfect.gendev7.check24.fun/api/external/offers';
    }
    getProviderName() {
        return 'PingPerfect';
    }
    fetchOffers(query) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const response = yield axiosInstance.post(this.baseUrl, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature': signature,
                    'X-Timestamp': timestamp,
                    'X-Client-Id': this.clientId
                }
            });
            return this.parsePingPerfectResponse(response.data);
        });
    }
    generateSignature(timestamp, data) {
        // FIXED: Correct format from docs - timestamp:requestbody (NO clientId!)
        const message = `${timestamp}:${data}`;
        console.log(`PingPerfect: Signing message: ${message.substring(0, 100)}...`);
        return crypto_1.default
            .createHmac('sha256', this.secret)
            .update(message)
            .digest('hex');
    }
    parsePingPerfectResponse(data) {
        const offers = [];
        if (data && data.offers && Array.isArray(data.offers)) {
            for (const item of data.offers) {
                const offer = {
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
exports.PingPerfectService = PingPerfectService;
