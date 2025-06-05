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
exports.providerRoutes = void 0;
const express_1 = require("express");
const ProviderManager_1 = require("../services/ProviderManager");
const router = (0, express_1.Router)();
exports.providerRoutes = router;
const providerManager = new ProviderManager_1.ProviderManager();
router.get('/test', (req, res) => {
    res.json({
        message: 'Provider routes working!',
        timestamp: new Date().toISOString()
    });
});
router.post('/compare', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { street, houseNumber, city, postalCode } = req.body;
        if (!street || !houseNumber || !city || !postalCode) {
            return res.status(400).json({
                error: 'Missing required fields: street, houseNumber, city, postalCode'
            });
        }
        const query = { street, houseNumber, city, postalCode };
        // Use real ProviderManager instead of mock
        const result = yield providerManager.compareProviders(query);
        res.json(result);
    }
    catch (error) {
        console.error('Provider comparison error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}));
