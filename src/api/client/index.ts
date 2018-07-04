const Router = require('koa-router');
const router = new Router({prefix: '/api/v1'});

import {Blocks} from './blocks';
import {Hashes} from './hashes';
import {Peers} from './peers';
import {Transactions} from './transactions';
import {Wallets} from './wallets';
import {Exchanges} from './exchanges';
import {Currencies} from './currencies';
import {Charts} from './charts';

const block = new Blocks();
const hashes = new Hashes();
const peers = new Peers();
const transactions = new Transactions();
const wallets = new Wallets();
const exchanges = new Exchanges();
const currencies = new Currencies();
const charts = new Charts();


router
  // BLOCKS
  .get('/', block.getLastInfo)

  .get('/block/:id', block.getByHeight)
  .get('/block/:id/transactions', block.getBlockTransactions)
  // -----------------------------------------------

  // TRANSACTIONS
  .get('/transaction/:hash/:field', transactions.getMoreInfo)
  // -----------------------------------------------

  // WALLET
  .get('/wallet/:hash/:field', wallets.getMoreInfo)
  // -----------------------------------------------

  // CURRENCIES
  .get('/currency/:frame/:since/:until', currencies.getChartData)
  .get('/currency/:frame/:since', currencies.getChartData)
  .get('/currency/:frame', currencies.getChartData)
  .get('/currency', currencies.getAllChartData)
  // -----------------------------------------------

  // CHARTS
  .get('/chart/currency/:frame/:since/:until', charts.getCurrencyChartData)
  .get('/chart/currency/:frame/:since', charts.getCurrencyChartData)
  .get('/chart/currency/:frame', charts.getCurrencyChartData)
  .get('/chart/currency', charts.getCurrencyAllChartData)
  // -----------------------------------------------

  // HASH
  .get('/hashes/:hash', hashes.findHash)
  // -----------------------------------------------

  // PEERS
  .get('/peers', peers.listPeers)
  // -----------------------------------------------

  // EXCHANGES
  .get('/exchanges/month', exchanges.averageRateByMonth)
// -----------------------------------------------

;

export default router;
