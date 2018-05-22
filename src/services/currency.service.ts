import * as Exchange from '../models/exchange';

let instance = null;

export class CurrencyService {
    private request;
    private parser;
    private lastInfo;

    constructor() {
        if (!instance) {
            this.request = require('request');
            this.parser = require('xml-parser');
            this.lastInfo = {
                coinPrice: {},
                euroRate: {},
                tftPrice: {
                    pairs: {},
                    weightedAveragePrice: 0,
                },
            }

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
                    };
                });
            }) as any;

            const coinPrice = prices.find(el => el.symbol === coin);

            this.lastInfo.coinPrice[coin] = Number.parseFloat(coinPrice.price_usd) || 0;

            return Number.parseFloat(coinPrice.price_usd) || 0;
        } catch (e) {
            console.error(e);
            return 0;
        }
    }

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
                    };
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
    }

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
    }

    calculateWeightedAverageTFTPrice = async () => {
        let result = 0
        let volume = 0;

        for (const key in this.lastInfo.tftPrice.pairs) {
            if (this.lastInfo.tftPrice.pairs.hasOwnProperty(key)) {
                if (key.includes('USD')) {
                    result += this.lastInfo.tftPrice.pairs[key].price * this.lastInfo.tftPrice.pairs[key].volume;
                } else {
                    const coin = key.split('_')[1];
                    const rate = this.lastInfo.coinPrice[coin];
                    result += this.lastInfo.tftPrice.pairs[key].price * rate * this.lastInfo.tftPrice.pairs[key].volume;
                }
                volume += this.lastInfo.tftPrice.pairs[key].volume;
            }
        }

        this.lastInfo.tftPrice.weightedAveragePrice = result / volume;
    }

    getBtcAlphaPrice = async (pair: String) => {
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
                    };
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
                    price: (last.low + last.high) / 2,
                    volume: last.volume,
                    volume24: rates.reduce((prev, curr) => {
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