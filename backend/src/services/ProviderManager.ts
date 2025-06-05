const { WebWunderService } = require('./providers/WebWunderService');
const { ByteMeService } = require('./providers/ByteMeService');
const { PingPerfectService } = require('./providers/PingPerfectService');
const { VerbynDichService } = require('./providers/VerbynDichService');
const { ServusSpeedService } = require('./providers/ServusSpeedService');

export class ProviderManager {
  private providers = [
    new WebWunderService(),
    new ByteMeService(),
    new PingPerfectService(),
    new VerbynDichService(),
    new ServusSpeedService()
  ];

  async compareProviders(query: any): Promise<any> {
    console.log('Starting provider comparison for:', query);

    const providerPromises = this.providers.map((provider: any) =>
      provider.getOffersWithRetry(query)
    );

    const providerResponses = await Promise.all(providerPromises);

    const totalOffers = providerResponses.reduce(
      (sum: number, response: any) => sum + response.offers.length, 0
    );

    return {
      query,
      providers: providerResponses,
      totalOffers,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { ProviderManager };
