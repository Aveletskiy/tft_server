import * as Unit from '../models/unit';
import * as Node from '../models/node';

const chalk = require('chalk');
const moment = require('moment');

let instance = null;

interface ILocation {
  city: string,
  continent: string,
  country: string,
  latitude: number,
  longitude: number
}

interface INode extends ILocation{
  cru: number,
  farmer: string,
  hru: number,
  location: ILocation,
  mru: number,
  node_id: string,
  os_version: string,
  robot_address: string,
  sru: number,
  updated: string,
  uptime: number
}



export class NodesService {
  private parser;
  private axios;

  constructor() {
    if (!instance) {
      this.axios = require(`axios`);
      this.parser = require('xml-parser');


      instance = this;
    }

    return instance;
  }

  async getCapacityRemoteChartInfo(){
    try {
      const nodesCapacityData = await this.axios.get(`https://capacity.threefoldtoken.com/api/nodes`);
      return nodesCapacityData.data;
    } catch(err) {
      console.log(chalk.red(err.request.path));
      console.log(chalk.red(err.message));

      return null;
    }
  }

  async updateCapacityInfo() {
    try {
      const remoteData = await this.getCapacityRemoteChartInfo();
      await this.updateUnitsStatistics(remoteData);
      let processArray = remoteData.slice();

      let countedInfo = [];

      processArray.forEach((unit) => {
        const filterResult = processArray
          .filter(item => unit.location.latitude === item.location.latitude
            && unit.location.longitude === item.location.longitude);

        if (filterResult.length) {
          if (processArray.length) {
            countedInfo.push({
              geo: {
                count: filterResult.length,
                coordinates: [unit.location.latitude, unit.location.longitude]
              }
            });
          }
          filterResult.forEach(item => {
            processArray = processArray.filter(e => e !== item);
          });
        }
      });
      let counted = countedInfo.reduce((acc, curr) => acc + curr.geo.count, 0);
      if (counted === remoteData.length) {
        await Node.collection.insert(countedInfo, (err, docs) => {
          if (err) {
            console.log(chalk.black.bgRed(err));
          } else {
            console.log(chalk.cyan.bgGreen(`NODES:: new ${docs.insertedCount} nodes alocated nodes was saved ${moment().format(`LLL`)}`));
          }
        });
      }
    } catch (err) {
      console.log(chalk.black.bgRed(err));
    }
  }

  async getHeatmapChartInfo(){
    try {
      return await Node.find({}, '-_id');
    } catch (err) {
      console.log(chalk.red(err.message));
      return null
    }
  }

  async getNodesStatistics(){
    try {
      const dataModel = await Unit.findOne({}, '-_id -createdAt -__v');
      return dataModel.toObject();
    } catch (err) {
      console.log(chalk.red(err.message));
      return null
    }
  }

  async updateUnitsStatistics(remoteData: Array<INode>) {
    try {
      const existData = await Unit.findOne({});

      const unitsSum = remoteData.reduce((acc, curr) => {
        acc.sru += curr.sru;
        acc.cru += curr.cru;
        acc.hru += curr.hru;
        return acc;
      }, {sru: 0, cru: 0, hru: 0});

      const storageUnitsTotal = unitsSum.sru / 135 + unitsSum.hru / 1093;
      await Unit.update({
        computeUnitsTotal: unitsSum.cru,
        storageUnitsTotal: storageUnitsTotal,
        storageUnitsTB: unitsSum.sru + unitsSum.hru,
        storageUnitsCores: unitsSum.cru,
        annualNetworkRevenue: unitsSum.cru * existData.computeUnitPriceUSD + storageUnitsTotal * existData.storageUnitPriceUSD
      },(err, docs) => {
        if (err) {
          console.log(chalk.black.bgRed(err));
        } else {
          console.log(chalk.cyan.bgGreen(`NODES:: statistic data has been updated ${moment().format(`LLL`)}`));
        }
      });
    } catch (err) {
      console.log(chalk.black.bgRed(err));
    }
  }

}
