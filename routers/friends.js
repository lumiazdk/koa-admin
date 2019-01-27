const Router = require('koa-router');
const moment = require('moment')
let router = new Router();
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
//添加好友
router.post('addFriend', async ctx => {
    let { user_id, friend_id, status } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        friend_id: { type: "required" },
        user_id: { type: "required" },
        status: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    await ctx.db.query('insert into friend (friend_id,user_id,status) values (?,?,?)', [friend_id, user_id, status])
    ctx.results.success({}, '请求成功')
})
//更新状态
router.post('updateFriend', async ctx => {
    let { user_id, friend_id, status } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        friend_id: { type: "required" },
        user_id: { type: "required" },
        status: { type: "required" },

    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    await ctx.db.query(`update friend set status=? where user_id=? and friend_id=?`, [status, user_id, friend_id])
    ctx.results.success({}, '请求成功')
})
//添加好友
router.post('addFriend', async ctx => {
    let { user_id, friend_id, status } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}
    let schema = {
        friend_id: { type: "required" },
        user_id: { type: "required" },
        status: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    await ctx.db.query('insert into friend (friend_id,user_id,status) values (?,?,?)', [friend_id, user_id, status])
    ctx.results.success({}, '请求成功')
})
//获取所有好友
router.post('getallFriend', async ctx => {
    let { user_id, status } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}
    let schema = {
        user_id: { type: "required" },
        status: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let data = await ctx.db.query('select * from friend where user_id=? and status=?', [user_id, status])
    for (let item of data) {
        let user = await ctx.db.query('select user_name,user_email,user_profile_photo,user_birthday,user_age,user_nickname,motto from users where user_id=?', [item.user_id])
        item.friendInfo = user[0]
    }
    ctx.results.success({ data }, '请求成功')
})
//获取请求
router.post('getFriend', async ctx => {
    let { searchId } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        searchId: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let arr = []
    let searchQuery = ''
    let data = await ctx.db.query(`select * from friend where user_id=? or friend_id=?`, [searchId, searchId])
    let result = []
    for (let item of Array.from(data)) {
        let friend = await ctx.db.query(`select user_name,user_id,motto,user_profile_photo from users where user_id=?`, [item.user_id])
        item.friend = friend[0]
        result.push(item)
    }
    ctx.results.success({ result })
})
module.exports = router.routes();
