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
  },

  storageUnitsTotal: {
    type: Number,
  },

  storageUnitsTB: {
    type: Number,
  },

  storageUnitsCores: {
    type: Number,
  },

  computeUnitPriceUSD: {
    type: Number,
  },

  storageUnitPriceUSD: {
    type: Number,
  },

  maxSupply: {
    type: Number,
  },

  annualNetworkRevenue: {
    type: Number,
  },

  fiveYearsNetworkRevenue: {
    type: Number,
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

export {Unit};
