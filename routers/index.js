const Router = require('koa-router');
const uuid = require('uuid')

let router = new Router();

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

module.exports = router.routes();
