import {TftApiService} from '../../services/tftAPI.service'
import {NodesService} from '../../services/nodes.service'

export class Peers {
  private tftApi;
  private geoip;
  private nodes;

  constructor() {
    this.tftApi = new TftApiService();
    this.nodes = new NodesService();
    this.geoip = require('geoip-lite')
  }


  getNodesList = async ctx => {
    const list = await this.nodes.getHeatmapChartInfo();
    ctx.body = {
      result: true,
      data: list,
    }
  };

  getNodesStatistic = async ctx => {
    const dataModel = await this.nodes.getNodesStatistics();
    ctx.body = {
      result: true,
      data: dataModel,
    }
  };

  /**
   * @deprecated
   * @param ctx
   * @returns {Promise<void>}
   */
  listPeers = async (ctx) => {
    const list = (await this.tftApi.getPeers()).peers;

    for (const peer of list) {
      const geo = this.geoip.lookup(peer.netaddress.split(':')[0]);
      peer['geo'] = {
        country: geo.country,
        coordinates: geo.ll || [0, 0]
      };
    }

    ctx.body = {
      result: true,
      data: list
    }
  }

}
