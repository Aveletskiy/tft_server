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
        const hash = ctx.params.hash;
        const cachedData = await this.cache.getField(`hash_${hash}`);
        if (cachedData) {
            return ctx.body = {
                result: true,
                data: cachedData,
                isCache: true
            }
        }

        let result = await Block.findById(hash).lean();

        if (!result) {
            result = await Transaction.findById(hash).lean();

            if (result) {
                const limit = 10;

                result.blockStakeInputs = result.blockStakeInputs.slice(0, limit);
                result.blockStakeOutputs = result.blockStakeOutputs.slice(0, limit);
                result.coinInputs = result.coinInputs.slice(0, limit);
                result.coinOutputs = result.coinOutputs.slice(0, limit);
            } 
        }
        
        if (!result) {
            result = await Wallet.findById(hash).lean();

            if (result) {
                const limit = 10;

                const txQuery = {
                    $or: [{
                        'coinInputs.address': hash
                    }, {
                        'coinOutputs.address': hash
                    }],
                };

                const transactions = await Transaction.find(txQuery).limit(limit).sort('-createdAt').lean();
                result.transactionsCount = await Transaction.count(txQuery);

                for (const tx of transactions) {
                    const userTx = {
                        _id: tx._id,
                        blockId: tx.blockInfo.height,
                        isLoading: true,
                        from: '',
                        timeStamp: tx.blockInfo.timeStamp,
                        balanceAfter: 0,
                        coinsInputSumm: 0,
                        coinsSumm: 0,
                        motion: [],
                        rates: tx.rates
                    }

                    if (tx.coinInputCount) {
                        if (tx.coinInputs[0].address === hash) {
                            userTx.from = hash;
                            userTx.isLoading = false;
                            userTx.coinsInputSumm = tx.coinInputs.reduce((prev, current) => {
                                return prev + current.value
                            }, 0);
 
                            for (const out of tx.coinOutputs) {
                                if (out.address !== hash) {
                                    userTx.motion.push({
                                        to: out.address,
                                        value: out.value
                                    });

                                    userTx.coinsSumm += out.value;
                                }

                                if (out.address === hash) {
                                    userTx.balanceAfter = out.value;
                                }
                            }

                        } else {
                            for (const out of tx.coinOutputs) {
                                userTx.from = tx.coinInputs[0].address;

                                if (out.address === hash) {
                                    userTx.motion.push({
                                        to: hash,
                                        value: out.value
                                    });

                                    userTx.coinsSumm += out.value;
                                }
                            }
                        }
                    }

                    if (userTx.motion.length) {
                        result.transactions.push(userTx);
                    }

                    if (result.transactionsCount) {
                        result.balance = result.transactions[0].balanceAfter;
                    }
                }

                const bsQuery = {
                    $or: [{
                        'blockStakeInputs.address': hash
                    }, {
                        'blockStakeOutputs.address': hash
                    }],
                };

                const transactionsBs = await Transaction.find(txQuery).limit(limit).sort('-createdAt').lean();
                result.blockStakeMotionCount = await Transaction.count(txQuery);

                for (const tx of transactionsBs) {

                    if (tx.blockStakeInputCount) {
                        for (const stake of tx.blockStakeInputs) {
                           if (stake.address === hash) {
                            result.blockStakeMotion.push({
                                ...stake,
                                blockHeigth: tx.blockInfo.height,
                                timeStamp: tx.blockInfo.timeStamp,
                                rates: tx.rates,
                                isInput: true
                            })
                           } 
                        }  
                    }

                    if (tx.blockStakeOutputCount) {
                        for (const stake of tx.blockStakeOutputs) {
                            if (stake.address === hash) {
                             result.blockStakeMotion.push({
                                 ...stake,
                                 blockHeigth: tx.blockInfo.height,
                                 timeStamp: tx.blockInfo.timeStamp,
                                 rates: tx.rates,
                                 isInput: false
                             })
                            } 
                         }  
                    }
                }

                const blockQuery = {
                    'minerPayouts.unlockHash': hash
                };

                const blocks = await Block.find(blockQuery).limit(limit).sort('-createdAt').lean();
                result.minerPayoutsCount = await Block.count(blockQuery);

                for (const block of blocks) {
                    for (const payout of block.minerPayouts) {
                        if (payout.unlockHash === hash) {
                            result.minerPayouts.push({
                                ...payout,
                                blockHeigth: block.height,
                                rates: block.rates
                            });
                        }
                        
                    }
                }
            }
        } 

        if (!result || result.message) {
            return ctx.body = {
                result: false,
                message: 'Invalid or unsupported hash'
            }
        }

        ctx.body = {
            result: true,
            data: result
        }

        this.cache.setField(`hash_${ctx.params.hash}`, result, 30);
    }
}
