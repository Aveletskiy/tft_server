import {CurrencyService} from '../../services/currency.service'

export class Currencies {
  private currencyApi;

  constructor() {
    this.currencyApi = new CurrencyService();
  }

  getChartDate = async (ctx) => {
    const chartData = await this.currencyApi.getTFT_BTCChartInfo(ctx.params.since, ctx.params.until);

    ctx.body = {
      result: true,
      data: chartData
    }
  }
  }
