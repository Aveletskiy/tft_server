import { TftApiService } from '../../services/tftAPI.service'

export class Hashes {
    private tftApi;

    constructor() {
        this.tftApi = new TftApiService();
    }


    findHash = async (ctx) => {
        const result = await this.tftApi.findByHash(ctx.params.hash);

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
    }
}
