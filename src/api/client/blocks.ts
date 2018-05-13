import { CurrencyService } from './../../services/currency.service';
import { TftApiService } from '../../services/tftAPI.service'

export class Blocks {
    private tftApi;
    private currencyService

    constructor() {
        this.tftApi = new TftApiService();
        this.currencyService = new CurrencyService();
    }


    getLastInfo = async (ctx) => {
        const main = await this.tftApi.getMainInfo();
        const last5 = await this.tftApi.getLastBlocks(9);

        if (!main || !last5 || !last5.length) {
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
                lastBlocks: last5,
                currency: {
                    btcUsd: coinPrice,
                    usdEur: currencyRate
                }
            }
        }
    }

    getByHeigth = async (ctx) => {
        const id = Number.parseInt(decodeURIComponent(ctx.params.id));
        if (!id) {
            return ctx.body = {
                result: false,
                message: 'Invalid block id'
            } 
        }

        const block = await this.tftApi.getBlockById(ctx.params.id);
        if (!block || block.message) {
            return ctx.body = {
                result: false,
                message: 'Invalid block id'
            }
        }

        ctx.body = {
            result: true,
            data: block
        }
    }
}
