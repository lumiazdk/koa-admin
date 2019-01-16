const Koa = require('koa');
var Router = require('koa-router');
const koaBetterBody = require('koa-better-body')
const convert = require('koa-convert');
const config = require('./config');
const staticCache = require('koa-static-cache');
const error = require('./libs/error_handler');
const loglib = require('./libs/log');
const koaJwt = require('koa-jwt') //路由权限控制

const app = new Koa();
//webpack

//连接数据库
let db = require('./libs/db');

//router
let mainRouter = new Router();
mainRouter.use('/', require('./routers/user'));

//错误处理
error(app);
loglib(app);

//秘钥
const jwtSecret = 'jwtSecret'

app.use(function (ctx, next) {
    return next().catch((err) => {
        if (401 == err.status) {
            ctx.status = 401;
            ctx.body = {
                code: -1,
                message: '没有权限，请重新登陆！'
            };
        } else {
            throw err;
        }
    });
});
app.use(koaJwt({ secret: jwtSecret }).unless({
    path: [/^\/login/]
}))
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