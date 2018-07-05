import {CurrencyService} from '../services/currency.service';
import {CacheService} from '../services/cache.service';

import * as Currency from './../models/currency';

const chalk = require('chalk');
const moment = require('moment');

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

  /**
   * обновляет кеш redis данными по паре TFT_BTC
   * @returns {Promise<object>}
   */
  async updateCachedTftBtcChartInfo(){
    const BTCAlphaCurrency = await this.currencyService.getTFT_BTCAllChartInfo();
    let TFT_BTC = [];
    for (const elem of BTCAlphaCurrency) {
      TFT_BTC.push([elem.timeStamp, elem.value])
    }
    return this.cache.setField('TFT_BTC', TFT_BTC);
  }

  async updateTftBtcChartInfo() {
    let timeFrames = {
      5: null,
      15: null,
      30: null,
      60: null,
      240: null,
      D: null,
    };

    console.log((` `));
    for (const prop in timeFrames){
      if (timeFrames.hasOwnProperty(prop)){

         const lastInFrames = await Currency
          .find({timeFrame: `${prop}`}, null,{sort: {timeStamp: -1}, limit: 1}).exec();

        const cachedLastTimeCut = lastInFrames.length ? lastInFrames[0].timeStamp : 0;

        timeFrames[prop] = await this.currencyService.getTftBtcRemoteChartInfo(`${prop}`,cachedLastTimeCut+1);

        const timeFrameBatch = timeFrames[prop].map(tick => {
          return {
            value: tick.close,
            volume: tick.volume,
            timeStamp: tick.time,
            timeFrame: `${prop}`
          };
        });

        if (timeFrameBatch.length){
          await Currency.collection.insert(timeFrameBatch, (err, docs) => {
            if(err){
              console.log(chalk.black.bgRed(err));
            } else {
              console.log(chalk.white.bgGreen(`CURRENCY:: new ${docs.insertedCount} ticks in ${prop} frame was saved ${moment().format(`LLL`)}`));
            }
          });
        } else {
          console.log(chalk.bgCyan(`CURRENCY:: in ${prop} frame nothing to update: ${moment().format(`LLL`)}`));
        }
      }
    }
  }
}
