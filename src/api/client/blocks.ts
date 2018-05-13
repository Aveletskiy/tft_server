import { CurrencyService } from './../../services/currency.service';
import { TftApiService } from '../../services/tftAPI.service'

import * as Block from '../../models/block';
import * as Transaction from '../../models/transaction';
import { CacheService } from '../../services/cache.service';

export class Blocks {
    private tftApi;
    private currencyService;
    private cache;

    constructor() {
        this.tftApi = new TftApiService();
        this.currencyService = new CurrencyService();
        this.cache = new CacheService();
    }


    getLastInfo = async (ctx) => {
        const main = await this.tftApi.getMainInfo();

        let last10 = await this.cache.getField(`lastBlocks`);
        if (!last10) {
            last10 = await this.tftApi.getLastBlocks(9);
            this.cache.setField(`lastBlocks`, last10, 300)
        }

        if (!main || !last10 || !last10.length) {
            return ctx.body = {
                result: true,
                message: 'Node not synced'
            };
        }

        const { coinPrice, currencyRate } = await this.currencyService.getLastInfo('BTC', 'USD');

        ctx.body = {
            result: true,
            data: {
                lastBlock: {
                    id: main.blockid,
                    height: main.height,
                    difficulty: main.difficulty,
                    timeStamp: main.maturitytimestamp,
                    activeBlockStake: main.estimatedactivebs
                },
                lastBlocks: last10,
                currency: {
                    btcUsd: coinPrice,
                    usdEur: currencyRate
                }
            }
        }
    }

    getByHeight = async (ctx) => {
        const id = Number.parseInt(decodeURIComponent(ctx.params.id));
        if (!id) {
            return ctx.body = {
                result: false,
                message: 'Invalid block id'
            } 
        }

        const cachedData = await this.cache.getField(`block_${ctx.params.id}`);
        if (cachedData) {
            return ctx.body = {
                result: true,
                data: cachedData,
                isCache: true
            }
        }

        const block = await Block.findOne({height: ctx.params.id}).lean();
        if (!block || block.message) {
            return ctx.body = {
                result: false,
                message: 'Invalid block id'
            }
        }

        const transactions = await Transaction.find({
            'blockInfo.height': block.height
        }).lean();

        const data = {
            block,
            transactions
        }

        ctx.body = {
            result: true,
            data,
            isCache: false
        }

        this.cache.setField(`block_${ctx.params.id}`, data, 30);
    }
}
