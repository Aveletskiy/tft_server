import { CacheService } from '../../services/cache.service';

import * as Block from '../../models/block';
import * as Transaction from '../../models/transaction';
import * as Wallet from '../../models/wallet';

export class Wallets {
    private cache;

    constructor() {
        this.cache = new CacheService();
    }

    getMoreInfo = async (ctx) => {
        const availibleFields = [
            'coin',
            'blockStake',
            'minerPayouts',
        ];

        const field = ctx.params.field;

        if (!(field in availibleFields)) {
            return ctx.body = {
                result: false,
                message: `Unsupported filed. Expected: ${availibleFields.join(', ')}`,
            }
        }

        let limit = ctx.query.limit || 5;
        let skip = ctx.query.skip || 0;
        

        ctx.body = {
            result: true,
            data: {
                list: [],
                count: 0
            }
        }
    }
}