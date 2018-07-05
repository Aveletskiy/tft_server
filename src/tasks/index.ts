import * as cron from 'node-cron';
import * as chalk from 'chalk';

import {Tick} from './tick';
import {Curency} from './currency';


export class Tasks {
  private tick = new Tick();
  private currency = new Curency();

  runTasks = () => {
    this.runTick();
    this.runUpdateCurrency();
  };

  // cron.scheduler('second(optional) minute hour day month weekday')
  runTick = () => {
    // every 3 seconds
    cron.schedule('*/3 * * * * *', () => {
      this.tick.sendTickData();
    });

    if (process.env.NODE_ENV === 'dev') {
      console.log(chalk.white.bgBlue.bold('[tasks] Задача отправки текущих данных запущена'));
    }
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

    cron.schedule('*/15 * * * *', async () => {
      await this.currency.updateCachedTftBtcChartInfo();
    });

    if (process.env.NODE_ENV === 'dev') {
      console.log(chalk.white.bgBlue.bold('[tasks] Задача обновления курсов запущена'));
    }
    console.log(chalk.white.bgBlue.bold('[tasks] Задача обновления курсов запущена'));
  }

}
