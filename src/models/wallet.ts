import {Document, model, Model, Schema} from 'mongoose';

interface IWallet extends Document {
    hashType: string;
    balance: number;
    coinsMotionCount: number;
    blockStakeMotionCount: number;

    blockStakeMotion: any;
    coinsMotion: any;
    
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

    coinsMotionCount: {
        type: Number,
        default: 0
    },
    blockStakeMotionCount: {
        type: Number,
        default: 0
    },

    blockStakeMotion: [],
    coinsMotion: [],

    balance: {
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
