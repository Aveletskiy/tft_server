import {Document, model, Model, Schema} from 'mongoose';

interface IWallet extends Document {
    hashType: string;
    balance: number;
    totalReceived: number;
    transactionsCount: number;
    blockStakeMotionCount: number;
    minerPayoutsCount: number;

    blockStakeMotion: any;
    transactions: any;
    minerPayouts: any;
    
    updatedAt: Date;
    createdAt: Date;
}

const schema = new Schema({
    _id: {
        type: String
    },

    hashType: {
        type: String,
        default: 'unlockhash'
    },

    transactionsCount: {
        type: Number,
        default: 0
    },
    blockStakeMotionCount: {
        type: Number,
        default: 0
    },
    minerPayoutsCount: {
        type: Number,
        default: 0
    },

    blockStakeMotion: [],
    transactions: [],
    minerPayouts: [],

    balance: {
        type: Number,
        default: 0
    },

    totalReceived: {
        type: Number,
        default: 0
    },

    updatedAt: {
        type: Date,
        default: Date.now
    },
        
    createdAt: {
        type: Date,
        default: Date.now
    },

});

const Wallet = model<IWallet>('Wallet', schema);

export = Wallet;
