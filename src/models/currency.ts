import {Document, model, Model, Schema} from 'mongoose';

interface ITimeFrames {
  5: object,
  15: object,
  30: object,
  60: object,
  240: object,
  D: object,
}

interface ICurrency extends Document {
  value: number;
  volume: number;
  timeStamp: number;
  timeFrame: ITimeFrames;
}

const schema = new Schema({
  timeStamp: {
    type:Number,
    index: true
  },
  timeFrame: {
    type: Object,
    index: true
  },
  value: Number,
  volume: Number,
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,

  },

  __v: {type: Number, select: false},

});

const Currency = model<ICurrency>('Currency', schema);

export = Currency;
