import {Document, model, Model, Schema} from 'mongoose';
import * as uuid from 'uuid';

interface IExchange {
    tradeName: string,
    time: number;
    open: number;
    close: number;
    low: number;
    high: number;
    volume: number;
    pair: string;
    createdAt: Date;
}

const schema = new Schema({
    _id: {
        type: String,
        default: uuid
    },

    tradeName: String,
    time: Number,
    open: Number,
    close: Number,
    low: Number,
    high: Number,
    volume: Number,
    pair: String,

    createdAt: {
        type: Date,
        default: Date.now
    },
});

const Exchange = model<IExchange>('Exchange', schema);

export = Exchange;