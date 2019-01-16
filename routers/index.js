const Router = require('koa-router');

let router = new Router();

//localhost:8080/
router.post('register', async ctx => {

    ctx.body = {
        name: 'zdsk',

    }
});

module.exports = router.routes();
