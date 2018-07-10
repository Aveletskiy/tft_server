import {Document, model, Model, Schema} from 'mongoose';


interface IUnit {
  count: number,
  coordinates: [number, number]
}

interface INode extends Document {
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


const Node = model<INode>('Node', schema);

export = Node;
