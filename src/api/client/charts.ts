import {CurrencyService} from '../../services/currency.service'

export class Charts {
  private currencyApi;

  constructor() {
    this.currencyApi = new CurrencyService();
  }

  getCurrencyChartData = async ctx => {
    const chartData = await this.currencyApi.getTFT_BTCChartInfo(ctx.params.frame, ctx.params.since, ctx.params.until);

    ctx.body = {
      result: true,
      data: chartData.map(elem => [elem.timeStamp, elem.value])
    }
  };

  getCurrencyAllChartData = async ctx => {
    const chartData = await this.currencyApi.getTFT_BTCAllChartInfo();

    ctx.body = {
      result: true,
      data: chartData.map(elem => [elem.timeStamp, elem.value])
    }
  }
}
