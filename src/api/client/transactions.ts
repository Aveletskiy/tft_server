import * as Transaction from '../../models/transaction';
import { CacheService } from '../../services/cache.service';

export class Transactions {
    private cache;

    constructor() {
        this.cache = new CacheService();
    }

    getMoreInfo = async (ctx) => {
        let transaction = await this.cache.getField(`tx_${ctx.params.hash}`);
        if (!transaction) {
            transaction = await Transaction.findById(ctx.params.hash).lean();
            
            if (!transaction) {
                return ctx.body = {
                    result: false,
                    message: 'Invalid transaction hash',
                }
            }

            this.cache.setField(`tx_${transaction._id}`, transaction, 30);
        }

        let limit = ctx.query.limit || 5;
        let skip = ctx.query.skip || 0;
        let field = ctx.params.field || 'coinOutputs';

        if (transaction[field].length < skip) {
            return ctx.body = {
                result: false,
                message: `Invalid skip. Max - ${transaction[field].length}`,
            }
        }

        const result = transaction[field].splice(skip, limit)

        return ctx.body = {
            result: true,
            data: {
                list: result,
                count: transaction[field].length,
            },
            field,
        }

    }
}
