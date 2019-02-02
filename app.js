const Koa = require('koa');
const Router = require('koa-router');
const koaBetterBody = require('koa-better-body')
const convert = require('koa-convert');
const config = require('./config');
const staticCache = require('koa-static-cache');
const error = require('./libs/error_handler');
const loglib = require('./libs/log');
const koaJwt = require('koa-jwt') //路由权限控制
const json_schema = require('./libs/json_schema.js')
const serve = require('koa-static');
const compress = require('koa-compress');
const app = new Koa();
const path = require('path')
//compress
const options = { threshold: 1024, flush: require('zlib').Z_SYNC_FLUSH };
//socket连接
const server = require('http').Server(app.callback());
const io = require('socket.io')(server);
const SocketIO = require('./socket.js')
global.port = 80;
global.ip = '47.244.57.219'
// global.ip = '192.168.0.10'

function getIPAdress() {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
}
const host = getIPAdress()
server.listen(process.env.PORT || port, host, () => {
    console.log(`app run at : http://${host}:${global.port}`);
})

//连接数据库
let db = require('./libs/db');
//socket
SocketIO(io, db)

//router
let mainRouter = new Router();
mainRouter.use('/', require('./routers/user'));
mainRouter.use('/', require('./routers/article'));
mainRouter.use('/', require('./routers/friends'));



//错误处理
error(app);
loglib(app);

//秘钥
const jwtSecret = 'jwtSecret'

app.use(async (ctx, next) => {

    ctx.response.set('Access-Control-Allow-Origin', '*');
    ctx.response.set('Access-Control-Allow-Methods', 'POST,GET,OPTIONS, PUT, DELETE');
    ctx.response.set('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
    // ctx.response.set('Content-Type', 'application/json;charset=utf-8');
    ctx.response.set('X-Powered-By', '3.2.1');



    //结果
    let results = {
        success(value, message = '成功') {
            ctx.body = {
                code: 1,
                result: { ...value },
                message: message
            }
        },
        error(message = '失败') {
            ctx.body = {
                code: 0,
                message: message
            }
        },
        jsonErrors(value, message = '数据验证失败') {
            ctx.body = {
                code: -104,
                result: { ...value },
                message: message
            }
        }
    }
    ctx.json_schema = json_schema
    ctx.results = results;
    ctx.db = db;
    await next()
});

// app.use(staticCache(config.wwwDir))
app.use(staticCache(path.join(__dirname, './build'))); 
app.use(serve(path.join(__dirname, './upload')));
app.use(staticCache(path.join(__dirname, './www')));
app.use(compress(options));
console.log(__dirname + '/upload')
app.use(function (ctx, next) {
    ctx.compress = true
    return next().catch((err) => {
        if (401 == err.status) {
            // ctx.status = 401;
            ctx.body = {
                code: -1,
                message: '没有权限，请重新登陆！'
            };
        } else {
            throw err;
        }
    });
});

// app.use(koaJwt({ secret: jwtSecret }).unless({
//     path: [/^\/login/, /.html/, /.css/,/.js/, /\w(\.gif|\.jpeg|\.png|\.jpg|\.bmp)/i]
// }))
app.use(convert(koaBetterBody(
    {
        uploadDir: config.uploadDir,
        keepExtensions: true

    }
)))
app.use(mainRouter.routes())


app.use(async (ctx, next) => {
    ctx.body = {
        err: '没有此api'
    }
})


// app.listen(config.port)