import * as cron from 'node-cron';
import * as chalk from 'chalk';

import {Tick} from './tick';
import {Curency} from './currency';
import {Nodes} from './nodes';


export class Tasks {
  private tick = new Tick();
  private currency = new Curency();
  private nodes = new Nodes();

  runTasks = () => {
    this.runFetchBtcAlphaData();
    this.runTick();
    this.runUpdateCurrency();
    this.runFetchCapacity();
  };

  // cron.scheduler('second(optional) minute hour day month weekday')
  runTick = () => {
    // every 3 seconds
    cron.schedule('*/3 * * * * *', () => {
      this.tick.sendTickData();
    });

    if (process.env.NODE_ENV === 'dev') {
      console.log(chalk.white.bgBlue.bold('[tasks] Socket update task is running'));
    }
  };

  runFetchBtcAlphaData = () => {
    this.currency.fillTFT_BTCQuotation();
  };

  runFetchCapacity = () => {
    // every 12 minutes
    cron.schedule('*/12 * * * * *', () => {
      this.nodes.fetchRemoteData();
    });
  };

  runUpdateCurrency = () => {
    this.currency.updateCurrencyInfo();

    // every 3 minutes
    cron.schedule('* */3 * * * *', () => {
      this.currency.updateCurrencyInfo();
    });

    // every minute
    cron.schedule('* * * * *', () => {
      this.currency.updateBtcAlphaInfo();
    });

    // every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.currency.updateTftBtcChartInfo();
    });

    if (process.env.NODE_ENV === 'dev') {
      console.log(chalk.white.bgBlue.bold('[tasks] Currency update task is running'));
    }
  }

}
