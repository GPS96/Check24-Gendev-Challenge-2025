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
exports.BaseProviderService = void 0;
const axios_1 = __importDefault(require("axios"));
class BaseProviderService {
    constructor() {
        this.timeout = 10000;
        this.maxRetries = 3;
    }
    getOffersWithRetry(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            let lastError = '';
            for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                try {
                    console.log(`${this.getProviderName()}: Attempt ${attempt}/${this.maxRetries}`);
                    const offers = yield this.fetchOffers(query);
                    const responseTime = Date.now() - startTime;
                    return {
                        provider: this.getProviderName(),
                        success: true,
                        offers,
                        responseTime
                    };
                }
                catch (error) {
                    lastError = this.getUserFriendlyError(error);
                    console.log(`${this.getProviderName()}: Attempt ${attempt} failed - ${error.message}`);
                    if (attempt < this.maxRetries) {
                        yield this.delay(1000 * attempt);
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
        });
    }
    // Convert technical errors to user-friendly messages
    getUserFriendlyError(error) {
        var _a, _b, _c, _d, _e, _f, _g;
        const provider = this.getProviderName();
        // Network/Connection errors
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return `${provider} is temporarily unavailable`;
        }
        // Authentication errors
        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401 || ((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 403) {
            return `${provider} service is currently unavailable`;
        }
        // Server errors
        if (((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) >= 500) {
            return `${provider} is experiencing technical difficulties`;
        }
        // Rate limiting
        if (((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) === 429) {
            return `${provider} is busy, please try again later`;
        }
        // Timeout errors
        if (error.code === 'ECONNABORTED' || ((_e = error.message) === null || _e === void 0 ? void 0 : _e.includes('timeout'))) {
            return `${provider} is responding slowly, please try again`;
        }
        // Crypto/Key errors (PingPerfect specific)
        if (((_f = error.message) === null || _f === void 0 ? void 0 : _f.includes('key')) || ((_g = error.message) === null || _g === void 0 ? void 0 : _g.includes('crypto'))) {
            return `${provider} service is currently unavailable`;
        }
        // Generic fallback
        return `${provider} is temporarily unavailable`;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    createAxiosInstance() {
        return axios_1.default.create({
            timeout: this.timeout,
            headers: {
                'User-Agent': 'CHECK24-Comparison-Tool/1.0'
            }
        });
    }
}
exports.BaseProviderService = BaseProviderService;
