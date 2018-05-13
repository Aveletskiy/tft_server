import clientRouter from './client';

const Router = require('koa-router');
const combineRouters = require('koa-combine-routers');
const router = combineRouters([
    clientRouter
]);

export default router;
