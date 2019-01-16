const Koa = require('koa');
var Router = require('koa-router');
const koaBetterBody = require('koa-better-body')
const convert = require('koa-convert');
const config = require('./config');
const staticCache = require('koa-static-cache');
const error = require('./libs/error_handler');
const loglib = require('./libs/log');


const app = new Koa();
//webpack

//连接数据库
let db = require('./libs/db');

//router
let mainRouter = new Router();
mainRouter.use('/', require('./routers/index'));

//错误处理
error(app);
loglib(app);

app

    .use(convert(koaBetterBody(
        {
            uploadDir: config.uploadDir,
            keepExtensions: true

        }
    )))
    .use(mainRouter.routes())

    .use(staticCache(config.wwwDir))
    .use(async (ctx, next) => {
        ctx.body = {
            err: '没有此api'
        }
    })


app.listen(3000)