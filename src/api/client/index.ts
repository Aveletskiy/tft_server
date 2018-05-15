const Router = require('koa-router');
const router = new Router({ prefix: '/api/v1' });

import { Blocks } from './blocks';
import { Hashes } from './hashes';
import { Peers } from './peers';
import { Transactions } from './transactions';
import { Wallets } from './wallets';

const block = new Blocks();
const hashes = new Hashes();
const peers = new Peers();
const transactions = new Transactions();
const wallets = new Wallets();

router
    // BLOCKS
    .get('/block', block.getLastInfo)

    .get('/block/:id', block.getByHeight)
    .get('/block/:id/transactions', block.getBlockTransactions)
    // -----------------------------------------------

    // TRANSACTIONS
    .get('/transaction/:hash/:field', transactions.getMoreInfo)
    // -----------------------------------------------

    // WALLET
    .get('/wallet/:hash/:field', wallets.getMoreInfo)
    // -----------------------------------------------

    // HASH
    .get('/hashes/:hash', hashes.findHash)
    // -----------------------------------------------

    // PEERS
    .get('/peers', peers.listPeers)
    // -----------------------------------------------

    ;

export default router;
