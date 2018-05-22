import * as cron from 'node-cron';
import * as chalk from 'chalk';

import { Tick } from './tick';
import { Curency } from './currency';


export class Tasks {
    private tick = new Tick();
    private currency = new Curency();

    runTasks = () => {
        this.runTick();
        this.runUpdateCurrency();
    }

    runTick = () => {
        cron.schedule('*/3 * * * * * *', () => {
            this.tick.sendTickData();
        });

        if (process.env.NODE_ENV === 'dev') {
            console.log(chalk.white.bgBlue.bold('[tasks] Задача отправки текущих данных запущена'));
        }
    }

    runUpdateCurrency = () => {
        this.currency.updateCurrencyInfo();

        cron.schedule('* */3 * * *', () => {
            this.currency.updateCurrencyInfo();
        });

        cron.schedule('* * * * *', () => {
            this.currency.updateBtcAlphaInfo();
        });

        if (process.env.NODE_ENV === 'dev') {
            console.log(chalk.white.bgBlue.bold('[tasks] Задача обновления курсов запущена'));
        }
    }
};
