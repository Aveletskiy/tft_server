import {Document, model, Model, Schema} from 'mongoose';

interface IWallet extends Document {
    hashType: string;
    balance: number;
    blockStakeInputCount: number;
    blockStakeOutputCount: number;
    coinInputCount: number;
    coinOutputCount: number;

    blockStakeInputs: any;
    blockStakeOutputs: any;
    сoinInput: any;
    coinOutput: any;
    
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

    blockStakeInputCount: Number,
    blockStakeOutputCount: Number,

    coinInputCount: Number,
    coinOutputCount: Number,

    сoinInput: [],
    coinOutput: [],

    blockStakeInputs: [],
    blockStakeOutputs: [],


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
