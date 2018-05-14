const Router = require('koa-router');
const router = new Router({ prefix: '/api/v1' });

import { Blocks } from './blocks';
import { Hashes } from './hashes';
import { Peers } from './peers';

const block = new Blocks();
const hashes = new Hashes();
const peers = new Peers();

router
    // BLOCKS
    .get('/block', block.getLastInfo)

    .get('/block/:id', block.getByHeight)
    .get('/block/:id/transactions', block.getBlockTransactions)
    // -----------------------------------------------

    // HASH
    .get('/hashes/:hash', hashes.findHash)
    // -----------------------------------------------

    // PEERS
    .get('/peers', peers.listPeers)
    // -----------------------------------------------

    ;

export default router;
