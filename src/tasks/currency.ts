import { CurrencyService } from './../services/currency.service';

export class Curency {
    private currencyService

    constructor() {
        this.currencyService = new CurrencyService();
    }

    updateCurrencyInfo = async () => {
        const coinPrice = await this.currencyService.getCoinPrice('BTC');
        const euroRate = await this.currencyService.getEuroRate('USD');
    }
}