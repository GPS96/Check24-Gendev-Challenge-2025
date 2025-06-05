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
exports.ProviderManager = void 0;
const { WebWunderService } = require('./providers/WebWunderService');
const { ByteMeService } = require('./providers/ByteMeService');
const { PingPerfectService } = require('./providers/PingPerfectService');
const { VerbynDichService } = require('./providers/VerbynDichService');
const { ServusSpeedService } = require('./providers/ServusSpeedService');
class ProviderManager {
    constructor() {
        this.providers = [
            new WebWunderService(),
            new ByteMeService(),
            new PingPerfectService(),
            new VerbynDichService(),
            new ServusSpeedService()
        ];
    }
    compareProviders(query) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Starting provider comparison for:', query);
            const providerPromises = this.providers.map((provider) => provider.getOffersWithRetry(query));
            const providerResponses = yield Promise.all(providerPromises);
            const totalOffers = providerResponses.reduce((sum, response) => sum + response.offers.length, 0);
            return {
                query,
                providers: providerResponses,
                totalOffers,
                timestamp: new Date().toISOString()
            };
        });
    }
}
exports.ProviderManager = ProviderManager;
module.exports = { ProviderManager };
