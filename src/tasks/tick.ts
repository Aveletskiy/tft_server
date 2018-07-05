import {CurrencyService} from '../services/currency.service';
import {TftApiService} from '../services/tftAPI.service'
import {SocketServer} from '../services/socket.service';
import {SyncBlockService} from '../services/syncBlocks.service';
import {CacheService} from '../services/cache.service';

import {Curency} from './currency'

export class Tick {
  private socketService;
  private tftApi;
  private currencyService;
  private syncedBlock;
  private syncBlockService;
  private cache;
  private currencyTask;

  constructor() {
    this.socketService = new SocketServer();
    this.tftApi = new TftApiService();
    this.currencyService = new CurrencyService;
    this.syncBlockService = new SyncBlockService();
    this.cache = new CacheService();
    this.currencyTask = new Curency();
    this.syncedBlock = 0;
  }

  sendTickData = async () => {
    const current = await this.tftApi.getCurrentInfo();

    if (!current) {
      return;
    }

    const {coinPrice, currencyRate, tftPrice} = await this.currencyService.getLastInfo('BTC', 'USD', ['TFT_BTC', 'TFT_USD']);
    const minerReward = current.rawblock.minerpayouts.reduce((prev, current) => {
      return prev + Number.parseInt(current.value);
    }, 0);

    try {
      let totalSupply = await this.cache.getField(`totalSupply`);
      if (totalSupply && totalSupply.height < current.height) {
        const value = totalSupply.value + minerReward;
        totalSupply = {
          value,
          height: current.height
        };
        this.cache.setField(`totalSupply`, totalSupply);
      }

      if (!totalSupply) {
        totalSupply = {
          value: 0,
        };
      }

      const tickData = {
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
          usdEur: currencyRate,
          tftPrice
        },
        totalSupply: totalSupply.value,
      };

      this.socketService.sendTick(tickData);

      if (this.syncedBlock !== current.height) {
        this.syncBlockService.syncBlockByHeight(current.height);
        this.syncedBlock = current.height;
      }

    } catch (e) {
      console.error(e);
    }

  }

}
