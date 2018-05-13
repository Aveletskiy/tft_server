import {Document, model, Model, Schema} from 'mongoose';

interface IMinerPayouts {
    minerPayoutId: string;
    unlockHash: string;
    value: number;
}

interface IBlock extends Document {
    hashType: string;
    height: number;
    parentId: string;
    timeStamp: number;
    difficulty: number;
    activeBlockStake: number;
    transactionsCount: number;
    minerReward: number;
    minerPayouts: IMinerPayouts[];
    rates: any;
    createdAt: Date;
}

const schema = new Schema({
    _id: {
        type: String
    },

    height: {
        type: Number,
        index: true,
        unique: true
    },

    hashType: String,
    parentId: String,
    timeStamp: Number,
    difficulty: Number,
    activeBlockStake: Number,
    transactionsCount: Number,
    minerReward: Number,

    minerPayouts: [{
        minerPayoutId: String,
        unlockHash: String,
        value: Number,
    }],

    rates: {},
        
    createdAt: {
        type: Date,
        default: Date.now
    },

});

const Block = model<IBlock>('Block', schema);

export = Block;
