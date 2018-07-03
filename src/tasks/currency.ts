import {CurrencyService} from './../services/currency.service';
import {CacheService} from './../services/cache.service';

import * as Currency from './../models/currency';

export class Curency {
  private currencyService;
  private cache;

  constructor() {
    this.currencyService = new CurrencyService();
    this.cache = new CacheService();
  }

  updateCurrencyInfo = async () => {
    const coinPrice = await this.currencyService.getCoinPrice('BTC');
    const euroRate = await this.currencyService.getEuroRate('USD');
  };

  updateBtcAlphaInfo = async () => {
    await this.currencyService.getBtcAlphaPrice('TFT_BTC');
    await this.currencyService.getBtcAlphaPrice('TFT_USD');
    this.currencyService.calculateWeightedAverageTFTPrice();
  };

  async updateTftBtcChartInfo() {
    const tft_btc = await this.currencyService.getTftBtcRemoteChartInfo();

    const lastTimeCut = tft_btc[tft_btc.length - 1].time;
    const cachedLastTimeCut = await this.cache.getField(`TFT_BTC_lastUpdate`);
    if (lastTimeCut !== cachedLastTimeCut) {
      await this.cache.setField(`TFT_BTC_lastUpdate`, lastTimeCut, 43200);

      for (const state of tft_btc){
        const existed = await Currency.findOne({timeStamp: state.time});
        const readyValue = {
          _id: state.time,
          value: state.close,
          volume: state.volume,
          timeStamp: state.time,
          updatedAt: Date.now()
        };
        if (existed) {
          await existed.update(
            readyValue
          );
          console.log(`CURRENCY:: currency updated ${readyValue}`);
        } else {
          console.log(`CURRENCY:: currency saved ${readyValue.timeStamp}`);
          await new Currency(readyValue).save();
        }
      }
    } else {
      console.log(`CURRENCY:: nothing to update`);
    }

  }
}
