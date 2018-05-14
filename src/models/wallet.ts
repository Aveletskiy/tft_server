import {Document, model, Model, Schema} from 'mongoose';

interface IWallet extends Document {
    hashType: string;
}

const schema = new Schema({
    _id: {
        type: String
    },

    hashType: {
        type: String,
        default: 'unlockhash'
    },
        
    createdAt: {
        type: Date,
        default: Date.now
    },

});

const Wallet = model<IWallet>('Wallet', schema);

export = Wallet;
