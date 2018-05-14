import { CurrencyService } from './currency.service';
import { TftApiService } from './tftAPI.service';
import { CacheService } from './cache.service';

import * as Block from '../models/block';
import * as Transaction from '../models/transaction';

export class SyncBlockService {
    private tftService;
    private currencyService;
    private cache;

    private currentSyncedBlock;
    private isSynced;

    constructor() {
        this.isSynced = false;
        this.currentSyncedBlock = 0;

        this.tftService = new TftApiService();
        this.currencyService = new CurrencyService();
        this.cache = new CacheService();
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

            console.log(block.height);

            for (const item of currentBlock.block.transactions) {
                const existTx = await Transaction.findById(item.id);
                if (existTx) {
                    continue;
                }

                const t = (await this.tftService.findByHash(item.id)).transaction;

                const blockStakeInputs = [];

                if (t.rawtransaction.data.blockstakeinputs) {
                    for (let i = 0; i < t.rawtransaction.data.blockstakeinputs.length; i++) {
                        const current = t.rawtransaction.data.blockstakeinputs[i];
    
                        const blockStake = {
                            parentId: current.parentid,
                            address: t.blockstakeinputoutputs[i].condition.data.unlockhash,
                            value: Number.parseInt(t.blockstakeinputoutputs[i].value),
                            unlockType: t.blockstakeinputoutputs[i].condition.type,
                            publicKey: '',
                            signature: ''
                        };
    
                        if (current.fulfillment) {
                            blockStake.publicKey = current.fulfillment.data.publickey;
                            blockStake.signature = current.fulfillment.data.signature;
                        } else if (current.unlocker && current.unlocker.fulfillment) {
                            blockStake.publicKey = current.unlocker.condition.publickey;
                            blockStake.signature = current.unlocker.fulfillment.signature;
                        }
    
                        blockStakeInputs.push(blockStake);
                    }
                } else if (t.rawtransaction.data.coininputs) {
                    for (let i = 0; i < t.rawtransaction.data.coininputs.length; i++) {
                        const current = t.rawtransaction.data.coininputs[i];
    
                        const blockStake = {
                            parentId: current.parentid,
                            address: t.coininputoutputs[i].condition.data.unlockhash,
                            value: Number.parseInt(t.coininputoutputs[i].value),
                            unlockType: t.coininputoutputs[i].condition.type,
                            publicKey: '',
                            signature: ''
                        };
    
                        if (current.fulfillment) {
                            blockStake.publicKey = current.fulfillment.data.publickey;
                            blockStake.signature = current.fulfillment.data.signature;
                        } else if (current.unlocker && current.unlocker.fulfillment) {
                            blockStake.publicKey = current.unlocker.condition.publickey;
                            blockStake.signature = current.unlocker.fulfillment.signature;
                        }
    
                        blockStakeInputs.push(blockStake);
                    }
                }
                

                const blockStakeOutputs = [];

                if (t.rawtransaction.data.blockstakeoutputs) {
                    for (let i = 0; i < t.rawtransaction.data.blockstakeoutputs.length; i++) {
                        const current = t.rawtransaction.data.blockstakeoutputs[i];
    
                        blockStakeOutputs.push({
                            id: t.blockstakeoutputids[i],
                            address: current.unlockhash || current.condition.data.unlockhash,
                            value: Number.parseInt(current.value),
                        });
                    }
                } else if (t.rawtransaction.data.coinoutputs) {
                    for (let i = 0; i < t.rawtransaction.data.coinoutputs.length; i++) {
                        const current = t.rawtransaction.data.coinoutputs[i];
    
                        blockStakeOutputs.push({
                            id: t.coinoutputids[i],
                            address: current.unlockhash || current.condition.data.unlockhash,
                            value: Number.parseInt(current.value),
                        });
                    }
                }

                const tx = new Transaction({
                    _id: t.id,
                    parentId: t.parent,
                    blockInfo: {
                        height: t.height,
                        id: block._id,
                        timeStamp: block.timeStamp,
                    },
                    blockStakeInputCount: blockStakeInputs.length,
                    blockStakeOutputCount: blockStakeOutputs.length,
                    blockStakeInputs,
                    blockStakeOutputs,
                    rates: {
                        btcUsd: coinPrice,
                        usdEur: currencyRate
                    },
                });

                await tx.save();
            }

            await block.save();

            const blockForCache = await Block.findById(block._id).lean();
            const transactions = await Transaction.find({
                'blockInfo.height': block.height
            }).lean();

            const cachedData = {
                block: blockForCache,
                transactions
            }

            this.cache.setField(`block_${block.height}`, cachedData, 30);

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

        await this.runSync();

        const lastBlocks = await Block.find({}).sort('-height').limit(10).lean();

        return this.cache.setField(`lastBlocks`, lastBlocks, 300);
    }
}
