import {Document, model, Model, Schema} from 'mongoose';

interface IBlockStakeInputs {
    parentId: string;
    address: string;
    value: number;
    unlockType: number;
    publicKey: string;
    signature: string;
}

interface IBlockStakeOutputs {
    id: string;
    address: string;
    value: number;
}

interface IBlockInfo {
    height: number;
    id: string;
    timeStamp: number;
}

interface ITransaction extends Document {
    hashType: string;
    blockInfo: IBlockInfo;
    blockStakeInputCount: number;
    blockStakeOutputCount: number;
    parentId: string;
    blockStakeInputs: IBlockStakeInputs;
    blockStakeOutputs: IBlockStakeOutputs;
    rates: any;
    createdAt: Date;
}

const schema = new Schema({
    _id: {
        type: String
    },

    hashType: {
        type: String,
        default: 'transactionid'
    },

    blockInfo: {
        height: Number,
        id: String,
        timeStamp: Number,
    },

    blockStakeInputCount: Number,
    blockStakeOutputCount: Number,

    parentId: String,

    blockStakeInputs: [{
        parentId: String,
        address: String,
        value: Number,
        unlockType: Number,
        publicKey: String,
        signature: String,
    }],

    blockStakeOutputs: [{
        id: String,
        address: String,
        value: Number,
    }],
    

    rates: {},
        
    createdAt: {
        type: Date,
        default: Date.now
    },

});

const Transaction = model<ITransaction>('Transaction', schema);

export = Transaction;
