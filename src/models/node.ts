import {Document, model, Model, Schema} from 'mongoose';

interface ILocation {
  city: string,
  continent: string,
  country: string,
  latitude: number,
  longitude: number
}

export interface INode extends ILocation{
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

interface IUnit {
  count: number,
  coordinates: [number, number]
}

interface IHeatNode extends Document {
  geo: IUnit
}


const schema = new Schema({
  _id: {
    type: String
  },

  geo: {
    type: Object,
  },
});


const Node = model<IHeatNode>('Node', schema);

export {Node};
