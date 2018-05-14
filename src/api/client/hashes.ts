import { TftApiService } from '../../services/tftAPI.service'

import * as Block from '../../models/block';
import * as Transaction from '../../models/transaction';
import { CacheService } from '../../services/cache.service';

export class Hashes {
    private tftApi;
    private cache;

    constructor() {
        this.tftApi = new TftApiService();
        this.cache = new CacheService();
    }


    findHash = async (ctx) => {
        const cachedData = await this.cache.getField(`hash_${ctx.params.hash}`);
        if (cachedData) {
            return ctx.body = {
                result: true,
                data: cachedData,
                isCache: true
            }
        }

        let result = await Block.findById(ctx.params.hash);

        if (!result) {
            result = await Transaction.findById(ctx.params.hash);
        }       

        if (!result) {
            result = await this.tftApi.findByHash(ctx.params.hash);
        }

        if (!result || result.message) {
            return ctx.body = {
                result: false,
                message: 'Invalid hash'
            }
        }

        // if (result.hashtype !== 'blockid' || result.hashtype !== 'transactionid') {
        //     return ctx.body = {
        //         result: false,
        //         message: 'Unsupported hash type'
        //     }
        // }

        ctx.body = {
            result: true,
            data: result
        }

        this.cache.setField(`hash_${ctx.params.hash}`, result, 30);
    }
}
