import { CurrencyService } from './currency.service';
import { TftApiService } from './tftAPI.service';

import * as Block from '../models/block';

export class SyncBlockService {
    private tftService;
    private currencyService;

    private currentSyncedBlock;
    private isSynced;

    constructor() {
        this.isSynced = false;
        this.currentSyncedBlock = 0;

        this.tftService = new TftApiService();
        this.currencyService = new CurrencyService();
        this.runSync();
    }

    private runSync = async () => {
        const maxBlockHeight = (await this.tftService.getCurrentInfo()).height;
        const lastSyncedBlock = await Block.findOne({}).sort('-height').select('height').lean();

        let startIndex = 1;

        if (lastSyncedBlock) {
            startIndex = lastSyncedBlock.height + 1;
        }

        let currentIndex = startIndex;

        while (currentIndex <= maxBlockHeight) {
            const currentBlock = await this.tftService.getBlockById(currentIndex);
            const { coinPrice, currencyRate } = await this.currencyService.getLastInfo('BTC', 'USD');
            const minerPayouts = [];

            for (let i = 0; i < currentBlock.block.minerpayoutids.length; i++) {
                minerPayouts.push({
                    minerPayoutId: currentBlock.block.minerpayoutids[i],
                    unlockHash: currentBlock.block.rawblock.minerpayouts[i].unlockhash,
                    value: Number.parseInt(currentBlock.block.rawblock.minerpayouts[i].value),
                });
            }

            const block = new Block({
                _id: currentBlock.block.blockid,
                height: currentBlock.block.height,
                parentId: currentBlock.block.rawblock.parentid,
                timeStamp: currentBlock.block.rawblock.timestamp,
                difficulty: Number.parseInt(currentBlock.block.difficulty),
                activeBlockStake: Number.parseInt(currentBlock.block.estimatedactivebs),
                transactionsCount: currentBlock.block.transactions.length,
                minerReward: currentBlock.block.rawblock.minerpayouts.reduce((prev, current) => {
                    return prev + Number.parseInt(current.value);
                }, 0),
                minerPayouts,
                rates: {
                    btcUsd: coinPrice,
                    usdEur: currencyRate
                },
            });

            await block.save();

            currentIndex ++;
        }

        const newMaxBlockHeight = (await this.tftService.getCurrentInfo()).height;
        if (newMaxBlockHeight > maxBlockHeight) {
            return this.runSync();
        }

        this.isSynced = true;
        this.currentSyncedBlock = maxBlockHeight;

        return null;
    }

    public syncBlockByHeight = async (height: number) => {
        if (!this.isSynced) {
            return null;
        }

        if (this.currentSyncedBlock === height) {
            return null;
        }

        return this.runSync();
    }
}
