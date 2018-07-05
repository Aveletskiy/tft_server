import * as Exchange from '../models/exchange';
import * as Currency from '../models/currency';

const chalk = require('chalk');
const moment = require('moment');

let instance = null;

interface ITimeFrames {
  5: object,
  15: object,
  30: object,
  60: object,
  240: object,
  D: object,
}

export class CurrencyService {
  private request;
  private parser;
  private lastInfo;
  private axios;

  constructor() {
    if (!instance) {
      this.request = require('request');
      this.axios = require(`axios`);
      this.parser = require('xml-parser');
      this.lastInfo = {
        coinPrice: {},
        euroRate: {},
        tftPrice: {
          pairs: {},
          weightedAveragePrice: 0,
        },
      };

      instance = this;
    }

    return instance;
  }

  getCoinPrice = async (coin: string) => {
    try {
      const prices = await new Promise((resolve, reject) => {
        this.request.get('https://api.coinmarketcap.com/v1/ticker/?limit=100', {}, (err, response, body) => {
          if (err) {
            resolve([]);
          } else {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              resolve([]);
            }
          }
        });
      }) as any;

      const coinPrice = prices.find(el => el.symbol === coin);

      this.lastInfo.coinPrice[coin] = Number.parseFloat(coinPrice.price_usd) || 0;

      return Number.parseFloat(coinPrice.price_usd) || 0;
    } catch (e) {
      console.error(e);
      return 0;
    }
  };

  getEuroRate = async (currency: string) => {
    try {
      const rates = await new Promise((resolve, reject) => {
        this.request.get('http://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', {}, (err, response, body) => {
          if (err) {
            resolve([]);
          } else {
            try {
              resolve(this.parser(body));
            } catch (e) {
              resolve([]);
            }
          }
        });
      }) as any;


      const cube = rates.root.children.find(el => el.name === 'Cube');
      const rate = cube.children[0].children.find(el => el.attributes.currency === currency);

      this.lastInfo.euroRate[currency] = Number.parseFloat(rate.attributes.rate);

      return Number.parseFloat(rate.attributes.rate) || 0;
    } catch (e) {
      console.error(e);
      return 0;
    }
  };

  getLastInfo = async (coin: string, currency: string, exchangePairs: any) => {
    let coinPrice = this.lastInfo.coinPrice[coin];
    if (!coinPrice) {
      coinPrice = await this.getCoinPrice(coin);
      this.lastInfo.coinPrice[coin] = coinPrice;
    }

    let currencyRate = this.lastInfo.euroRate[currency];
    if (!currencyRate) {
      currencyRate = await this.getEuroRate(currency);
      this.lastInfo.euroRate[currency] = currencyRate;
    }

    let tftPrice = this.lastInfo.tftPrice;

    if (Object.keys(tftPrice.pairs).length < exchangePairs.length) {
      for (const pair of exchangePairs) {
        await this.getBtcAlphaPrice(pair);
      }
      this.calculateWeightedAverageTFTPrice();
      tftPrice = this.lastInfo.tftPrice;
    }

    return {
      coinPrice,
      currencyRate,
      tftPrice
    }
  };

  calculateWeightedAverageTFTPrice = async () => {
    let result = 0;
    let volume = 0;

    for (const key in this.lastInfo.tftPrice.pairs) {
      if (this.lastInfo.tftPrice.pairs.hasOwnProperty(key)) {
        if (key.includes('USD')) {
          result += this.lastInfo.tftPrice.pairs[key].price
            * (this.lastInfo.tftPrice.pairs[key].volume || this.lastInfo.tftPrice.pairs[key].currentVolume);
        } else {
          const coin = key.split('_')[1];
          const rate = this.lastInfo.coinPrice[coin];
          result += this.lastInfo.tftPrice.pairs[key].price * rate
            * (this.lastInfo.tftPrice.pairs[key].volume || this.lastInfo.tftPrice.pairs[key].currentVolume);
        }

        volume += this.lastInfo.tftPrice.pairs[key].volume || this.lastInfo.tftPrice.pairs[key].currentVolume;
      }
    }

    console.log('WeightedAverage', result, volume);

    this.lastInfo.tftPrice.weightedAveragePrice = result / volume;
  };

  /**
   * Получить текущий упрощенный timeStamp
   */
  getCurrentTimeStamp = () => Math.floor(new Date().getTime() / 1000);

  getUnixTimeStamp = (timeStamp) => Math.floor(timeStamp / 1000);

  /**
   * Рекурентная функция по сбору данных с BTC-ALPHA
   * @param timeFrame
   * @param {number} until
   * @param {number} total
   * @returns {Promise<void>}
   */
  async fillDataBaseByTftBtcQuotation(timeFrame,until=this.getCurrentTimeStamp(), total=0) {
    const timeFrameData = await this.getTftBtcRemoteChartInfo(timeFrame,0, until);
    if (timeFrameData && timeFrameData.length > 2) {
      const timeFrameBatch = await timeFrameData.map(tick => {
        return {
          value: tick.close,
          volume: tick.volume,
          timeStamp: tick.time * 1000,
          timeFrame: `${timeFrame}`
        };
      });
      const lastFrameTime = this.getUnixTimeStamp(timeFrameBatch[timeFrameBatch.length-1].timeStamp);

      await Currency.collection.insert(timeFrameBatch, (err, docs) => {
        if (err) {
          console.log(chalk.black.bgRed(err));
        } else {
          console.log(chalk.cyan.bgGreen(`CURRENCY:: new ${docs.insertedCount} ticks in ${timeFrame} frame was saved ${moment().format(`LLL`)}`));
        }
      });

      total+=timeFrameBatch.length;
      console.log(chalk.yellow(`count ${timeFrameBatch.length}`));
      console.log(chalk.yellow(`batch ${new Date(lastFrameTime*1000)}`));

      await this.fillDataBaseByTftBtcQuotation(timeFrame, lastFrameTime, total)
    } else {
      console.log(chalk.cyan(`total ${total}`));
      return;
    }
  }

  /**
   * Запросить из btc-alpha.com данные по паре TFT-BTC
   * не более 720 записей за раз
   * @param {string} timeFrame - frames 5, 15, 30, 60, 240, D
   * @param {number} since - default 01.01.2018 00:00 GMT UNIX
   * @param {number} until - UNIX timestamp
   * @returns {Promise<void>}
   */
  async getTftBtcRemoteChartInfo(timeFrame = `5`,since = 1514764800, until = this.getCurrentTimeStamp()) {
    try {
      const chartData = await this.axios.get(`https://btc-alpha.com/api/charts/TFT_BTC/${timeFrame}/chart/?since=${since}&until=${until}`);
      return chartData.data;
    } catch (err) {
      console.log(chalk.red(err.request.path));
      console.log(chalk.red(err.message));

      return null;
    }
  }

  /**
   * Запросить из базы сохранные данные по паре TFT-BTC
   * @param {string} timeFrame - временное окно 5, 15, 30, 60, 240, D
   * @param {number} since - standard timestamp
   * @param {number} until - standard timestamp
   */
  getTFT_BTCChartInfo(timeFrame = `5`, since = 0, until = Date.now()) {
    return Currency.find({timeStamp: {$gte: since, $lte: until}, timeFrame: timeFrame.toUpperCase()}, '-_id value timeFrame timeStamp', {sort: {timeStamp: 1}});
  }

  /**
   * Запросить из базы сохранные данные по паре TFT-BTC по timeFrame 15 минут
   */
  getTFT_BTCAllChartInfo() {
    return Currency.find({}, '-_id value timeFrame timeStamp');
  }

  async getBtcAlphaPrice (pair: String) {
    try {
      const rates = await new Promise((resolve, reject) => {
        const now = Math.round(new Date().getTime() / 1000);
        const since = now - 86400; //1526894938;
        this.request.get(`https://btc-alpha.com/api/charts/${pair}/15/chart/?format=json&since=${since}`, {}, (err, response, body) => {
          if (err) {
            resolve([]);
          } else {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              resolve([]);
            }
          }
        });
      }) as any;

      for (const rate of rates) {
        const exist = await Exchange.findOne({
          time: rate.time,
          pair,
        }).lean();

        if (exist) {
          continue;
        }

        await new Exchange({
          ...rate,
          dateOfMonth: new Date().getDate(),
          pair,
          tradeName: 'btc-alpha.com'
        }).save();
      }

      const last = await Exchange.findOne({pair}).sort('-time').lean();

      if (last) {
        this.lastInfo.tftPrice.pairs[`${pair}`] = {
          price: last.close,
          currentVolume: last.volume,
          volume: rates.reduce((prev, curr) => {
            return prev + curr.volume
          }, 0),
        };
      }
    } catch (e) {
      console.error(e);
    }

    return;
  }

}
