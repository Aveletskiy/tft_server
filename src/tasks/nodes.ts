import {NodesService} from '../services/nodes.service';

const chalk = require('chalk');
const moment = require('moment');

export class Nodes {
  private nodesService;

  constructor(){
    this.nodesService = new NodesService();
  }

   async fetchRemoteData() {
    await this.nodesService.updateCapacityInfo();
  }


}
