import { CacheService } from '../../services/cache.service';

import * as Exchange from '../../models/exchange';

export class Exchanges {
    private cache;
    private pairs = ['TFT_BTC', 'TFT_USD'];

    constructor() {
        this.cache = new CacheService();
    }

    averageRateByMonth = async (ctx) => {
        const result = {};

        for (const pair of this.pairs) {
            const cachedData = await this.cache.getField(`averageRateByMonth_${pair}`);
            if (cachedData) {
                result[pair] = cachedData;
                continue;
            }

            const avg = await Exchange.aggregate([
                {
                    $match: { pair }
                }, {
                    $group : {
                        _id : {
                            month: { $month: "$createdAt" },
                            day: { $dayOfMonth: "$createdAt" },
                            year: { $year: "$createdAt" }
                        },
                        averagePriceLow: { $avg: "$low" },
                        averagePriceHigh: { $avg: "$high" },
                    }
                }
            ]);

            this.cache.setField(`averageRateByMonth_${pair}`, avg, 86400);

            result[pair] = avg;
        }
        
        ctx.body = {
            result: true,
            data: result
        }
    }
}
