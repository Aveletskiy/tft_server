import {Document, model, Model, Schema} from 'mongoose';

interface IPoint {
  name: string;
  value: number;
}

interface ISeries extends IPoint {
  name: string,
  series: Array<IPoint>,
}

interface IUnit extends Document {
  computeUnitsTotal: number,
  storageUnitsTotal: number,
  storageUnitsTB: number,
  storageUnitsCores: number,
  computeUnitPriceUSD: number,
  storageUnitPriceUSD: number,
  maxSupply: number,
  annualNetworkRevenue: number,

  computeUnitPrice: ISeries,
  storageUnitPrice: ISeries,

  updatedAt: Date;
  createdAt: Date;
}

const schema = new Schema({
  _id: {
    type: String
  },

  computeUnitsTotal: {
    type: Number,
    default: 25200
  },

  storageUnitsTotal: {
    type: Number,
    default: 91578
  },

  storageUnitsTB: {
    type: Number,
    default: 73000
  },

  storageUnitsCores: {
    type: Number,
    default: 28000
  },

  computeUnitPriceUSD: {
    type: Number,
    default: 12
  },

  storageUnitPriceUSD: {
    type: Number,
    default: 10
  },

  maxSupply: {
    type: Number,
    default: 100000000000
  },

  annualNetworkRevenue: {
    type: Number,
    default: 0
  },

  computeUnitPrice: {
    name: {
      type: String,
      default: 'Compute Unit price'
    },
    series: [
      {
        name: String,
        value: Number
      }
    ]
  },

  storageUnitPrice: {
    name: {
      type: String,
      default: 'Storage Unit price'
    },
    series: [
      {
        name: String,
        value: Number
      }]
  },


});


const Unit = model<IUnit>('Unit', schema);

export = Unit;
