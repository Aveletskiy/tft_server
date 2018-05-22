import { CurrencyService } from './../../services/currency.service';
import { TftApiService } from '../../services/tftAPI.service'
import { CacheService } from '../../services/cache.service';

import * as Block from '../../models/block';
import * as Transaction from '../../models/transaction';


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

        let totalSupply = await this.cache.getField(`totalSupply`);
        if (!totalSupply) {
            totalSupply = {
                value: await this.calculateTotalSupply(),
                height: main.height
            };
            this.cache.setField(`totalSupply`, totalSupply);
        }

        if (!main || !last10 || !last10.length) {
            return ctx.body = {
                result: true,
                message: 'Node not synced'
            };
        }

        const { coinPrice, currencyRate, tftPrice } = await this.currencyService.getLastInfo('BTC', 'USD', ['TFT_BTC', 'TFT_USD']);

        ctx.body = {
            result: true,
            data: {
                lastBlock: {
                    _id: main.blockid,
                    height: main.height,
                    difficulty: main.difficulty,
                    timeStamp: main.maturitytimestamp,
                    activeBlockStake: main.estimatedactivebs
                },
                lastBlocks: last10,
                currency: {
                    btcUsd: coinPrice,
                    usdEur: currencyRate,
                    tftPrice,
                },
                totalSupply: totalSupply.value,
            }
        }
    }

    getBlockTransactions = async (ctx) => {
        const id = Number.parseInt(decodeURIComponent(ctx.params.id));
        if (!id && id !== 0) {
            return ctx.body = {
                result: false,
                message: 'Invalid block id',
            } 
        }

        let limit = ctx.query.limit || 5;
        let skip = ctx.query.skip || 0;

        const cachedData = await this.cache.getField(`block_${id}_tx`);
        if (cachedData) {
            return ctx.body = {
                result: true,
                data: {
                    list: cachedData.splice(skip, limit),
                    count: cachedData.length,
                },
                isCache: true,
            }
        }

        const transactions = await Transaction.find({
            'blockInfo.height': id
        }).lean();
        
        for (const tx of transactions) {
            delete tx.blockStakeInputs;
            delete tx.blockStakeOutputs;
            delete tx.coinInputs;
            delete tx.coinOutputs;
        }

        await this.cache.setField(`block_${id}_tx`, transactions, 30);

        ctx.body = {
            result: true,
            data: {
                list: transactions.splice(skip, limit),
                count: transactions.length,
            },
            isCache: false,
        }
    }

    getByHeight = async (ctx) => {
        const id = Number.parseInt(decodeURIComponent(ctx.params.id));
        if (!id && id !== 0) {
            return ctx.body = {
                result: false,
                message: 'Invalid block id',
            } 
        }

        const cachedData = await this.cache.getField(`block_${id}`);
        if (cachedData) {
            return ctx.body = {
                result: true,
                data: cachedData,
                isCache: true,
            }
        }

        const block = await Block.findOne({height: id}).lean();
        if (!block || block.message) {
            return ctx.body = {
                result: false,
                message: 'Invalid block id',
            }
        }

        ctx.body = {
            result: true,
            data: block,
            isCache: false,
        }

        this.cache.setField(`block_${id}`, block, 30);
    }

    calculateTotalSupply = async () => {
        const stats = await Block.aggregate([{
            $group: {
                _id : null,
                totalSupply: { $sum: '$minerReward' },
            },
        }]);

        const genesisBlockTxs = await Transaction.findOne({'blockInfo.height': 0}).lean();
        const genesisSuply = genesisBlockTxs.coinOutputs.reduce((prev, curr) => prev + curr.value, 0);

        return stats[0].totalSupply + genesisSuply;
    }
}