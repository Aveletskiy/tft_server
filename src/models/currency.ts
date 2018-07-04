import {Document, model, Model, Schema} from 'mongoose';

interface ICurrency extends Document {
  value: number;
  volume: number;
  timeStamp: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema({
  _id: String,
  timeStamp: Number,
  value: Number,
  volume: Number,
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  __v: {type: Number, select: false},

});

const Currency = model<ICurrency>('Currency', schema);

export = Currency;
