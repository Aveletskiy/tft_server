import { CacheService } from '../../services/cache.service';

import * as Exchange from '../../models/exchange';

export class Exchanges {
    private cache;

    constructor() {
        this.cache = new CacheService();
    }

    averageRateByMonth = async (ctx) => {
        const result = [];

        const cachedData = await this.cache.getField(`averageRateByMonth_TFT_USD`);
        if (cachedData) {
            return ctx.body = {
                result: true,
                data: cachedData
            }
        }

        const avg = await Exchange.aggregate([
            {
                $match: {
                    pair: 'TFT_USD',
                    dateOfMonth: 1,
                }
            }, {
                $group : {
                    _id : {
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    averagePriceLow: { $avg: '$low' },
                    averagePriceHigh: { $avg: '$high' },
                }
            }, {
                $sort : { createdAt : 1,}
            }
        ]);

        for (const item of avg) {
            result.push({
                name: `${this.perfectDate(item._id.day)}/${this.perfectDate(item._id.month)}`,
                value: (item.averagePriceLow + item.averagePriceHigh) / 2,
            })
        }

        this.cache.setField(`averageRateByMonth_TFT_USD`, result, 86400);
        
        ctx.body = {
            result: true,
            data: result
        }
    }

    perfectDate = (number) => {
        if (number < 10) {
            return `0${number}`;
        }

        return number
    }
}
