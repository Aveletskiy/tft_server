import {CurrencyService} from '../../services/currency.service'

export class Currencies {
  private currencyApi;

  constructor() {
    this.currencyApi = new CurrencyService();
  }

  getChartData = async ctx => {
    const chartData = await this.currencyApi.getTFT_BTCChartInfo(ctx.params.frame, ctx.params.since, ctx.params.until);

    ctx.body = {
      result: true,
      data: chartData
    }
  };

  getAllChartData = async ctx => {
    const chartData = await this.currencyApi.getTFT_BTCAllChartInfo();

    ctx.body = {
      result: true,
      data: chartData
    }
  }
}
