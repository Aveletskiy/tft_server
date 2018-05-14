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

    getBlockTransactions = async (ctx) => {
        const id = Number.parseInt(decodeURIComponent(ctx.params.id));
        if (!id) {
            return ctx.body = {
                result: false,
                message: 'Invalid block id'
            } 
        }

        const cachedData = await this.cache.getField(`block_${id}_tx`);
        if (cachedData) {
            return ctx.body = {
                result: true,
                data: cachedData,
                isCache: true
            }
        }

        const transactions = await Transaction.find({
            'blockInfo.height': id
        }).lean();

        ctx.body = {
            result: true,
            data: transactions,
            isCache: false
        }

        this.cache.setField(`block_${id}_tx`, transactions, 30);
    }

    getByHeight = async (ctx) => {
        const id = Number.parseInt(decodeURIComponent(ctx.params.id));
        if (!id) {
            return ctx.body = {
                result: false,
                message: 'Invalid block id'
            } 
        }

        const cachedData = await this.cache.getField(`block_${id}`);
        if (cachedData) {
            return ctx.body = {
                result: true,
                data: cachedData,
                isCache: true
            }
        }

        const block = await Block.findOne({height: id}).lean();
        if (!block || block.message) {
            return ctx.body = {
                result: false,
                message: 'Invalid block id'
            }
        }

        ctx.body = {
            result: true,
            data: block,
            isCache: false
        }

        this.cache.setField(`block_${id}`, block, 30);
    }
}
