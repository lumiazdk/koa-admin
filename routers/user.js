const Router = require('koa-router');
const crypto = require('crypto')
const jwt = require('jwt-simple')
const uuid = require('uuid')
const captchapng = require('captchapng')
let router = new Router();

//秘钥
const jwtSecret = 'jwtSecret'
const tokenExpiresTime = 1000 * 60 * 60 * 24 * 7

//注册
router.post('register', async ctx => {

    let { user_telephone_number, user_password, motto = '这个人很懒，什么都没留下' } = ctx.request.fields ? ctx.request.fields : {}
    const user_name = `用户${uuid.v1().split('-')[0]}`
    const user_profile_photo = `http://127.0.0.1:8080/photo.jpeg`
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        user_telephone_number: { type: "required", reg: /^1[34578]\d{9}$/, message: '手机号有误' },
        user_password: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    //处理密码
    var md5 = crypto.createHash('md5').update(user_password, 'utf-8').digest('hex');
    //sql
    let ishave = await ctx.db.query("select (user_telephone_number) from users where user_telephone_number=?", [user_telephone_number])
    if (ishave.length > 0) {
        ctx.results.error('此用户已注册')
    } else {
        let data = await ctx.db.query("insert into users (user_telephone_number,user_password,user_name,user_profile_photo,create_time,update_time,motto) values (?,?,?,?,?,?,?);", [user_telephone_number, md5, user_name, user_profile_photo, new Date(), new Date(), motto]);
        let payload = {
            exp: Date.now() + tokenExpiresTime,
            user_telephone_number: user_telephone_number
        }
        let userInfo = await ctx.db.query("select * from users where user_id=?", [data.insertId])
        delete userInfo[0].user_password
        let token = jwt.encode(payload, jwtSecret)
        ctx.results.success({
            token, userInfo: userInfo[0]
        })
    }
});

//登陆
router.post('login', async ctx => {


    const { user_telephone_number, user_password, captcha } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        user_telephone_number: { type: "required", reg: /^1[34578]\d{9}$/, message: '手机号有误' },
        user_password: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
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
    const ishave = await ctx.db.query("select * from users where user_telephone_number=?", [user_telephone_number])
    if (ishave.length == 0) {
        ctx.results.error('暂无此用户！')
    } else {
        var md5 = crypto.createHash('md5').update(user_password, 'utf-8').digest('hex');

        if (ishave[0].user_password == md5) {
            let payload = {
                exp: Date.now() + tokenExpiresTime,
                user_telephone_number: user_telephone_number
            }
            let token = jwt.encode(payload, jwtSecret)
            ctx.results.success({
                token, userInfo: ishave[0]
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

    let { user_telephone_number } = ctx.request.fields ? ctx.request.fields : {};
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        user_telephone_number: { type: "required", reg: /^1[34578]\d{9}$/, message: '手机号有误' },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let ishave = await ctx.db.query("select * from users where user_telephone_number=?", [user_telephone_number])
    let data = ishave[0]
    delete data['user_password']
    if (ishave.length > 0) {
        ctx.results.success({
            userInfo: data
        })
    }

})

//更新用户
router.post('updateUserInfo', async (ctx) => {


    let { id, name, photo } = ctx.request.fields ? ctx.request.fields : {};
    let body = ctx.request.fields ? ctx.request.fields : {}

    if (photo) {
        photo = `http://127.0.0.1:8080/${ctx.request.files[0].path.split('\\').reverse()[0]}`
    } else {
        let oldphoto = await ctx.db.query('select * from users where id=?', [id])
        photo = oldphoto[0].user_profile_photo
    }
    let schema = {
        id: { type: "required" },
        name: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let ishave = await ctx.db.query(`update users set name=?,user_profile_photo=? where id=?`, [name, user_profile_photo, id])
    ctx.results.success()

})
router.post('getUsers', async ctx => {

    let { page, pageSize, where } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        page: { type: "required" },
        pageSize: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
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
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        id: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
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
