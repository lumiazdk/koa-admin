const Router = require('koa-router');
const crypto = require('crypto')
const jwt = require('jwt-simple')
const uuid = require('uuid')
const captchapng = require('captchapng')
let router = new Router();
const secret = 'abcdefg';
//秘钥
const jwtSecret = 'jwtSecret'
const tokenExpiresTime = 1000 * 60 * 60 * 24 * 7

//注册
router.post('register', async ctx => {

    let { phone, password } = ctx.request.fields ? ctx.request.fields : {}
    const name = `用户${uuid.v1().split('-')[0]}`
    const photo = `127.0.0.1:8080/photo.jpeg`
    if (!(/^1[34578]\d{9}$/.test(phone))) {
        ctx.results.error('手机号有误')
        return false;
    } else if (!password) {
        ctx.results.error('密码不能为空')
        return false;
    }
    //处理密码
    var md5 = crypto.createHash('md5').update(password, 'utf-8').digest('hex');
    //sql
    let ishave = await ctx.db.query("select (phone) from users where phone=?", [phone])
    if (ishave.length > 0) {
        ctx.results.error('此用户已注册')
    } else {
        let data = await ctx.db.query("insert into users (phone,password,name,photo) values (?,?,?,?);", [phone, md5, name, photo]);
        let payload = {
            exp: Date.now() + tokenExpiresTime,
            phone: phone
        }
        let token = jwt.encode(payload, jwtSecret)
        ctx.results.success({
            token, userInfo: {
                name,
                phone,
                photo
            }
        })
    }
});

//登陆
router.post('login', async ctx => {


    const { phone, password, captcha } = ctx.request.fields ? ctx.request.fields : {}
    if (!(/^1[34578]\d{9}$/.test(phone))) {
        ctx.results.error('手机号有误')
        return false;
    } else if (!password) {
        ctx.results.error('密码不能为空')
        return false;
    }
    //判断验证码
    if (0) {
        let cap = ctx.cookies.get('captcha')
        if (cap != captcha) {
            ctx.status = 401;
            ctx.body = {
                message: '验证码错误'
            }
            return
        }
    }
    //sql
    const ishave = await ctx.db.query("select * from users where phone=?", [phone])
    if (ishave.length == 0) {
        ctx.results.error('暂无此用户！')
    } else {
        var md5 = crypto.createHash('md5').update(password, 'utf-8').digest('hex');

        if (ishave[0].password == md5) {
            let payload = {
                exp: Date.now() + tokenExpiresTime,
                phone: phone
            }
            let token = jwt.encode(payload, jwtSecret)
            let { name, photo } = ishave[0]
            ctx.results.success({
                token, userInfo: {
                    name: name.split('-')[0],
                    phone,
                    photo
                }
            })
        } else {
            ctx.results.error('密码错误！')
        }
    }
});

//图片验证码
router.post('getCaptchas', async ctx => {
    const cap = parseInt(Math.random() * 9000 + 1000);
    const p = new captchapng(80, 30, cap);
    p.color(0, 0, 0, 0);
    p.color(80, 80, 80, 255);
    const base64 = p.getBase64();
    ctx.cookies.set('captcha', cap, { maxAge: 360000, httpOnly: true });
    ctx.status = 200
    ctx.body = {
        code: 'data:image/png;base64,' + base64
    }
})

//用户详情
router.post('userInfo', async (ctx) => {

    let { phone } = ctx.request.fields ? ctx.request.fields : {};
    if (!(/^1[34578]\d{9}$/.test(phone))) {
        ctx.results.error('手机号有误')
        return false;
    }
    let ishave = await ctx.db.query("select * from users where phone=?", [phone])
    let data = ishave[0]
    delete data['password']
    if (ishave.length > 0) {
        ctx.results.success({
            userInfo: data
        })
    }

})

//用户详情
router.post('updateUserInfo', async (ctx) => {


    let { id, name, photo } = ctx.request.fields ? ctx.request.fields : {};
    if (photo) {
        photo = `127.0.0.1:8080/${ctx.request.files[0].path.split('\\').reverse()[0]}`
    } else {
        let oldphoto = await ctx.db.query('select * from users where id=?', [id])
        photo = oldphoto[0].photo
    }
    if (!id) {
        ctx.results.error('id不能为空！')
        return false;
    }
    if (!name) {
        ctx.results.error('姓名不能为空！')
        return false;
    }
    let ishave = await ctx.db.query(`update users set name=?,photo=? where id=?`, [name, photo, id])
    ctx.results.success()

})
router.post('getUsers', async ctx => {

    let { page, pageSize, where } = ctx.request.fields ? ctx.request.fields : {}
    if (!/^[0-9]+$/.test(page)) {
        ctx.results.error('page为必传')
        return
    } else if (!/^[0-9]+$/.test(pageSize)) {
        ctx.results.error('pageSize为必传')
        return
    }
    let arr = []
    let searchQuery = ''
    if (JSON.stringify(where) != "{}") {
        for (let k in where) {
            arr.push(`${k}="${where[k]}"`)
        }
        searchQuery = `where ${arr.toString()}`

    }
    let start = 0 + (page - 1) * 10
    let data = await ctx.db.query(`select * from users ${searchQuery} limit ?,?`, [start, parseInt(pageSize)])
    let total = await ctx.db.query('select count(*) from users')
    let pageInfo = {
        total: total[0]['count(*)'],
        page,
        pageSize
    }
    ctx.results.success({ data, pageInfo })
})
router.post('deleteUsers', async ctx => {
    let { id } = ctx.request.fields ? ctx.request.fields : {}
    if (!/^[0-9]+$/.test(id)) {
        ctx.results.error('id必为整数')
        return
    }
    let ishave = await ctx.db.query('select * from users where id=?', [id])
    if (ishave.length == 0) {
        ctx.results.error('暂无此用户！')
        return
    }
    let result = await ctx.db.query('delete from users where id=?', [id])
    ctx.results.success({}, '删除成功！')
})

module.exports = router.routes();
