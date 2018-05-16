import { CurrencyService } from './../services/currency.service';
import { TftApiService } from '../services/tftAPI.service'
import { SocketServer } from '../services/socket.service';
import { SyncBlockService } from '../services/syncBlocks.service';
import { CacheService } from '../services/cache.service';

export class Tick {
    private socketService;
    private tftApi;
    private currencyService;
    private syncedBlock;
    private syncBlockService;
    private cache;

    constructor() {
        this.socketService = new SocketServer();
        this.tftApi = new TftApiService();
        this.currencyService = new CurrencyService;
        this.syncBlockService = new SyncBlockService();
        this.cache = new CacheService();
        this.syncedBlock = 0;
    }

    sendTickData = async () => {
        const current = await this.tftApi.getCurrentInfo();

        if (!current) {
            return;
        }

        const { coinPrice, currencyRate } = await this.currencyService.getLastInfo('BTC', 'USD');
        const minerReward = current.rawblock.minerpayouts.reduce((prev, current) => {
            return prev + Number.parseInt(current.value);
        }, 0);

        try {
            let maxSuply = await this.cache.getField(`maxSuply`);
            if (maxSuply && maxSuply.height < current.height) {
                const value = maxSuply.value + minerReward;
                maxSuply = {
                    value,
                    height: current.height
                };
                this.cache.setField(`maxSuply`, maxSuply);
            }

            if (!maxSuply) {
                maxSuply = {
                    value: 0,
                };
            }

            this.socketService.sendTick({
                lastBlock: {
                    _id: current.blockid,
                    height: current.height,
                    parentId: current.rawblock.parentid,
                    difficulty: current.difficulty,
                    timeStamp: current.rawblock.timestamp,
                    activeBlockStake: current.estimatedactivebs,
                    transactionsCount: current.transactions.length,
                    minerReward
                },
                currency: {
                    btcUsd: coinPrice,
                    usdEur: currencyRate
                },
                maxSuply: maxSuply.value
            })

            if (this.syncedBlock !== current.height) {
                this.syncBlockService.syncBlockByHeight(current.height);
                this.syncedBlock = current.height;
            }

        } catch (e) {
            console.error(e);
        }
        
    }

}
