import {CurrencyService} from '../services/currency.service';
import {CacheService} from '../services/cache.service';

import * as Currency from './../models/currency';

const chalk = require("chalk");

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
    let tft_btc;

    const cachedLastTimeCut = await this.cache.getField(`TFT_BTC_lastUpdate`);
    if (cachedLastTimeCut) {
      tft_btc = await this.currencyService.getTftBtcRemoteChartInfo(cachedLastTimeCut);
    } else {
      tft_btc = await this.currencyService.getTftBtcRemoteChartInfo();
    }

    if (tft_btc.length && tft_btc[tft_btc.length - 1].time !== cachedLastTimeCut) {

      await this.cache.setField(`TFT_BTC_lastUpdate`, tft_btc[tft_btc.length - 1].time);

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
          console.log(chalk.bgMagenta(`CURRENCY:: currency updated ${readyValue}`));
        } else {
          console.log(chalk.bgGreen(`CURRENCY:: currency saved ${readyValue.timeStamp}`));
          await new Currency(readyValue).save();
        }
      }
    } else {
      console.log(chalk.bgCyan(`CURRENCY:: nothing to update: ${new Date()}`));
      console.log(chalk.bgCyan(`CURRENCY:: last chached timeStamp: ${new Date(cachedLastTimeCut)}`));
    }

  }
}
