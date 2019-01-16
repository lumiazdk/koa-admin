const Router = require('koa-router');
const uuid = require('uuid')
const jwt = require('jwt-simple')

let router = new Router();

//秘钥
const jwtSecret = 'jwtSecret'
const tokenExpiresTime = 1000 * 60 * 60 * 24 * 7

//注册
router.post('register', async ctx => {
    let results = {
        success(value) {
            return {
                code: 1,
                result: { ...value }
            }
        }
    }
    let { phone, password, file = '' } = ctx.request.fields
    ctx.body = results.success({ data: [1, 2, 3, 4] })
});

//登陆
router.post('login', async ctx => {
    let results = {
        success(value) {
            return {
                code: 1,
                result: { ...value }
            }
        }
    }
    let { name } = ctx.request.fields
    // ctx.body = results.success({ data: [1, 2, 3, 4] })
    if (name) {
        let payload = {
            exp: Date.now() + tokenExpiresTime,
            name: name
        }
        let token = jwt.encode(payload, jwtSecret)

        ctx.body = {
            user: name,
            code: 1,
            token
        }
    } else {
        ctx.body = {
            code: -1
        }
    }
});

//用户详情
router.post('userInfo', async (ctx) => {
    let { name } = ctx.request.fields

    let token = ctx.header.authorization
    ctx.body = {
        token: token,
        user: name
    }
    //使用jwt-simple自行解析数据
    let payload = jwt.decode(token.split(' ')[1], jwtSecret);
    console.log(payload)
})

module.exports = router.routes();
