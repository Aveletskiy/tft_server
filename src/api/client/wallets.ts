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
            'transactions',
            'blockStakeMotion',
            'minerPayouts',
        ];

        const field = ctx.params.field;

        if (!(availibleFields.includes(field))) {
            return ctx.body = {
                result: false,
                message: `Unsupported filed. Expected: ${availibleFields.join(', ')}`,
            }
        }

        const wallet = await Wallet.findById(ctx.params.hash).lean();

        if (!wallet) {
            return ctx.body = {
                result: false,
                message: 'Invalid or unsupported hash'
            }
        }

        const limit = Number.parseInt(ctx.query.limit) || 5;
        const skip = Number.parseInt(ctx.query.skip) || 0;

        const list = [];
        let count = 0;

        if (field === 'transactions') {
            const txQuery = {
                $or: [{
                    'coinInputs.address': wallet._id
                }, {
                    'coinOutputs.address': wallet._id
                }],
            };

            const transactions = await Transaction.find(txQuery).limit(limit).skip(skip).sort('-createdAt').lean();
            count = await Transaction.count(txQuery);

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

                // const notOut = tx.coinOutputs.find((el) => el.address === wallet._id);

                if (tx.coinInputCount && tx.coinInputs[0].address === wallet._id) {
                    userTx.isLoading = false;
                }

                // if (tx.coinInputCount && !notOut) {
                //     if (tx.coinInputs[0].address === wallet._id) {
                //         userTx.from = wallet._id;
                //         userTx.coinsInputSumm = tx.coinInputs.reduce((prev, current) => {
                //             return prev + current.value
                //         }, 0);

                //         for (const out of tx.coinOutputs) {
                //             if (out.address !== wallet._id) {
                //                 userTx.motion.push({
                //                     to: out.address,
                //                     value: out.value
                //                 });

                //                 userTx.coinsSumm += out.value;
                //             }

                            

                //         }
                //     }
                // } 
                
                if (tx.coinOutputCount) {
                    for (const out of tx.coinOutputs) {
                        if (tx.coinInputCount) {
                            userTx.from = tx.coinInputs[0].address;
                        }
                        
                        if (out.address === wallet._id && userTx.from !== wallet._id) {
                            userTx.motion.push({
                                to: out.address,
                                value: out.value,
                                lockTime: out.lockTime || null,
                            });

                            userTx.coinsSumm += out.value;
                        }

                        if (out.address !== wallet._id && userTx.from == wallet._id) {
                            userTx.motion.push({
                                to: out.address,
                                value: out.value,
                                lockTime: out.lockTime || null,
                            });

                            userTx.coinsSumm += out.value;
                        }

                        if (out.address === wallet._id && userTx.from == wallet._id) {
                            userTx.balanceAfter = out.value;
                        }

                    }
                }
                
                if (userTx.motion.length) {
                    list.push(userTx);
                }

            }
        }

        if (field === 'blockStakeMotion') {
            const bsQuery = {
                $or: [{
                    'blockStakeInputs.address': wallet._id
                }, {
                    'blockStakeOutputs.address': wallet._id
                }],
            };

            const transactionsBs = await Transaction.find(bsQuery).limit(limit).skip(skip).sort('-createdAt').lean();
            count = await Transaction.count(bsQuery);

            for (const tx of transactionsBs) {

                if (tx.blockStakeInputCount) {
                    for (const stake of tx.blockStakeInputs) {
                       if (stake.address === wallet._id) {
                        list.push({
                            ...stake,
                            blockHeigth: tx.blockInfo.height,
                            timeStamp: tx.blockInfo.timeStamp,
                            rates: tx.rates,
                            isInput: true,
                            parentTransaction: tx._id
                        })
                       } 
                    }  
                }

                if (tx.blockStakeOutputCount) {
                    for (const stake of tx.blockStakeOutputs) {
                        if (stake.address === wallet._id) {
                            list.push({
                             ...stake,
                             blockHeigth: tx.blockInfo.height,
                             timeStamp: tx.blockInfo.timeStamp,
                             rates: tx.rates,
                             isInput: false,
                             parentTransaction: tx._id
                         })
                        } 
                     }  
                }
            }
        }

        if (field === 'minerPayouts') {
            const blockQuery = {
                'minerPayouts.unlockHash': wallet._id
            };

            const blocks = await Block.find(blockQuery).limit(limit).skip(skip).sort('-createdAt').lean();
            count = await Block.count(blockQuery);

            for (const block of blocks) {
                for (const payout of block.minerPayouts) {
                    if (payout.unlockHash === wallet._id) {
                        list.push({
                            ...payout,
                            blockHeigth: block.height,
                            rates: block.rates
                        });
                    }
                    
                }
            }
        }
        

        ctx.body = {
            result: true,
            data: {
                list,
                count
            }
        }
    }
}