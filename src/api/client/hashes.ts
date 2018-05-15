import { TftApiService } from '../../services/tftAPI.service'
import { CacheService } from '../../services/cache.service';

import * as Block from '../../models/block';
import * as Transaction from '../../models/transaction';
import * as Wallet from '../../models/wallet';


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

        let result = await Block.findById(ctx.params.hash).lean();

        if (!result) {
            result = await Transaction.findById(ctx.params.hash).lean();

            if (result) {
                const limit = 10;

                result.blockStakeInputs = result.blockStakeInputs.slice(0, limit);
                result.blockStakeOutputs = result.blockStakeOutputs.slice(0, limit);
                result.coinInputs = result.coinInputs.slice(0, limit);
                result.coinOutputs = result.coinOutputs.slice(0, limit);
            } 
        }
        
        if (!result) {
            result = await Wallet.findById(ctx.params.hash).lean();

            if (result) {
                
            }
        } 

        // if (!result) {
        //     result = await this.tftApi.findByHash(ctx.params.hash);
        // }

        if (!result || result.message) {
            return ctx.body = {
                result: false,
                message: 'Invalid hash'
            }
        }

        ctx.body = {
            result: true,
            data: result
        }

        this.cache.setField(`hash_${ctx.params.hash}`, result, 30);
    }
}
