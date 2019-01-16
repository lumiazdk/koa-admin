const Router = require('koa-router');

let router = new Router();

//localhost:8080/
router.get('', async ctx => {
    ctx.body = {
        name: 'zdk'
    }
});

module.exports = router.routes();
