import {CurrencyService} from '../services/currency.service';
import {CacheService} from '../services/cache.service';

import * as Currency from './../models/currency';

const chalk = require('chalk');
const moment = require('moment');

export class Curency {
  private currencyService;
  private cache;
  private timeFrames = {
    5: null,
    15: null,
    30: null,
    60: null,
    240: null,
    D: null,
  };

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
    const BTCAlphaCurrency = await this.currencyService.getTFT_BTCChartInfo(`15`);
    let TFT_BTC = [];
    for (const elem of BTCAlphaCurrency) {
      TFT_BTC.push([elem.timeStamp, elem.value])
    }
    console.log(chalk.blue.bgYellow(`TFT_BTC redis update ${moment().format('LLL')}`));
    return this.cache.setField('TFT_BTC', TFT_BTC);
  }

  async fillTFT_BTCQuotation(){
    await Currency.remove({});
    console.log(chalk.red(`clean currencies collection...`));
    for (const frame in this.timeFrames) {
      if (this.timeFrames.hasOwnProperty(frame)){
        console.log(chalk.green(`FRAME ${frame}`));
        await this.currencyService.fillDataBaseByTftBtcQuotation(frame);
        console.log(chalk.green(`----------------------`));
      }
    }
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
    try {
      for (const prop in timeFrames){
        if (timeFrames.hasOwnProperty(prop)){

          const lastInFrames = await Currency
            .find({timeFrame: `${prop}`}, null,{sort: {timeStamp: -1}, limit: 1}).exec();

          const cachedLastTimeCut = lastInFrames.length ? lastInFrames[0].timeStamp : 0;

          timeFrames[prop] = await this.currencyService.getTftBtcRemoteChartInfo(`${prop}`,cachedLastTimeCut/1000+1);

          debugger;
          if (timeFrames[prop] && timeFrames[prop].length) {
            const timeFrameBatch = await timeFrames[prop].map(tick => {
              return {
                value: tick.close,
                volume: tick.volume,
                timeStamp: tick.time * 1000,
                timeFrame: `${prop}`
              };
            });

            await Currency.collection.insert(timeFrameBatch, (err, docs) => {
              if (err) {
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
    }catch (err) {
      console.log(err);
    }

  }
}
