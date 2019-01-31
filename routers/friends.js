const Router = require('koa-router');
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
    await ctx.db.query(`update friend set status=? where user_id=? and friend_id=?`, [status, friend_id, user_id])
    if (global.userServer[user_id]) {
        global.userServer[user_id].emit('getFriendRequest')
    }
    if (global.userServer[friend_id]) {
        global.userServer[friend_id].emit('getFriendRequest')
    }
    ctx.results.success({}, '请求成功')
})
//添加好友？
router.post('addFriend', async ctx => {
    let { user_id, friend_id, status, request_id } = ctx.request.fields ? ctx.request.fields : {}
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
    await ctx.db.query('insert into friend (friend_id,user_id,status,request_id) values (?,?,?,?)', [friend_id, user_id, status, request_id])
    await ctx.db.query('insert into friend (friend_id,user_id,status,request_id) values (?,?,?,?)', [user_id, friend_id, status, request_id])
    if (global.userServer[user_id]) {
        global.userServer[user_id].emit('getFriendRequest')
    }
    if (global.userServer[friend_id]) {
        global.userServer[friend_id].emit('getFriendRequest')
    }
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
        let user = await ctx.db.query('select user_name,user_email,user_profile_photo,user_birthday,user_age,user_nickname,motto from users where user_id=?', [item.friend_id])
        item.friendInfo = user[0]
    }
    ctx.results.success({ data }, '请求成功')
})
//获取请求
router.post('getFriend', async ctx => {
    let { user_id } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        user_id: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let result = await ctx.db.query(`select * from friend where user_id=?`, [user_id])
    let num = 0
    for (let item of result) {
        if (item.is_read == 1 && item.request_id != user_id) {
            num = num + 1
        }
        let friend = await ctx.db.query(`select user_name,user_id,motto,user_profile_photo from users where user_id=?`, [item.friend_id])
        item.friend = friend[0]

    }
    ctx.results.success({ result, is_readnum: num })
})
//消除请求数量
router.post('clearFriendBadge', async ctx => {
    let { user_id, friend_id } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        user_id: { type: "required" },
        friend_id: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    await ctx.db.query(`update friend set is_read=0 where user_id=? and friend_id=?`, [user_id, friend_id])

    ctx.results.success({})
})
//创建聊天
router.post('addChat', async ctx => {
    let { user_id, friend_id, create_time = new Date(), update_time = new Date() } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}
    let schema = {
        friend_id: { type: "required" },
        user_id: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let isHave = await ctx.db.query('select * from chat where user_id=? and friend_id=?', [user_id, friend_id])

    if (isHave.length > 0) {
        await ctx.db.query(`update chat set update_time=? where user_id=? and friend_id=?`, [new Date(), user_id, friend_id])
        // let user = await ctx.db.query('select user_name,user_email,user_profile_photo,user_birthday,user_age,user_nickname,motto from users where user_id=?', [isHave[0].friend_id])
        // isHave[0].friendInfo = user[0]
        ctx.results.success({}, '更新成功')

    } else {
        await ctx.db.query('insert into chat (friend_id,user_id,create_time,update_time) values (?,?,?,?)', [friend_id, user_id, create_time, update_time])
        let chat = await ctx.db.query('select * from chat where user_id=? and friend_id=?', [user_id, friend_id])
        // let user = await ctx.db.query('select user_name,user_email,user_profile_photo,user_birthday,user_age,user_nickname,motto from users where user_id=?', [chat[0].friend_id])
        // chat[0].friendInfo = user[0]
        ctx.results.success({}, '请求成功')
    }

})
//更新聊天
router.post('updateChat', async ctx => {
    let { user_id, friend_id } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}
    let schema = {
        friend_id: { type: "required" },
        user_id: { type: "required" },
        last_message: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    await ctx.db.query(`update chat set message_num=? where user_id=? and friend_id=?`, [0, user_id, friend_id])
    ctx.results.success({}, '更新成功')
})
//获取聊天
router.post('getChat', async ctx => {
    let { user_id } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}
    let schema = {
        user_id: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let chat = await ctx.db.query('select * from chat where user_id=? order by update_time DESC', [user_id])
    for (let item of chat) {
        let user = await ctx.db.query('select user_name,user_email,user_profile_photo,user_birthday,user_age,user_nickname,motto from users where user_id=?', [item.friend_id])
        let last_message = await ctx.db.query('select * from message where chat_id=? order by create_time DESC', [item.id])
        item.friendInfo = user[0]
        if (last_message.length > 0) {
            item.last_message = last_message[0].message
            item.chatTime = last_message[0].create_time


        }

    }
    ctx.results.success({ chat }, '请求成功')
})
//getOneChat
router.post('getOneChat', async ctx => {
    let { user_id, friend_id } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}
    let schema = {
        user_id: { type: "required" },
        friend_id: { type: "required" },

    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let chat = await ctx.db.query('select * from chat where user_id=? and friend_id=?', [user_id, friend_id])

    ctx.results.success({ chat }, '请求成功')
})
//添加信息
router.post('addMessage', async ctx => {
    let { user_id, friend_id, create_time = new Date(), update_time = new Date(), message, chat_id } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}
    let schema = {
        friend_id: { type: "required" },
        user_id: { type: "required" },
        message: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let chat = await ctx.db.query('select * from chat where user_id=? and friend_id=?', [friend_id, user_id])

    if (chat.length > 0) {
        await ctx.db.query('insert into message (friend_id,user_id,create_time,update_time,message,chat_id) values (?,?,?,?,?,?)', [friend_id, user_id, create_time, update_time, message, chat_id])
        await ctx.db.query('insert into message (friend_id,user_id,create_time,update_time,message,chat_id) values (?,?,?,?,?,?)', [friend_id, user_id, create_time, update_time, message, chat[0].id])
        await ctx.db.query(`update chat set message_num=? where user_id=? and friend_id=?`, [chat[0].message_num + 1, friend_id, user_id])
        if (global.userServer[friend_id]) {
            global.userServer[friend_id].emit('getChat')
        }
        if (global.userServer[user_id]) {
            global.userServer[user_id].emit('getChat')
        }
    } else {
        let chat = await ctx.db.query('insert into chat (friend_id,user_id,create_time,update_time) values (?,?,?,?)', [user_id, friend_id, create_time, update_time])
        let chat_friend = await ctx.db.query('select * from chat where user_id=? and friend_id=?', [user_id, friend_id])

        await ctx.db.query('insert into message (friend_id,user_id,create_time,update_time,message,chat_id) values (?,?,?,?,?,?)', [friend_id, user_id, create_time, update_time, message, chat_id])
        await ctx.db.query('insert into message (friend_id,user_id,create_time,update_time,message,chat_id) values (?,?,?,?,?,?)', [friend_id, user_id, create_time, update_time, message, chat.insertId])
        await ctx.db.query(`update chat set message_num=? where user_id=? and friend_id=?`, [chat_friend[0].message_num + 1, friend_id, user_id])
        if (global.userServer[friend_id]) {
            global.userServer[friend_id].emit('getChat')
        }
        if (global.userServer[user_id]) {
            global.userServer[user_id].emit('getChat')
        }

    }
    ctx.results.success({}, '请求成功')
})
//获取信息
router.post('getMessage', async ctx => {
    let { chat_id } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}
    let schema = {
        chat_id: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let message = await ctx.db.query('select * from message where chat_id=?', [chat_id])
    for (let item of message) {
        let user = await ctx.db.query('select user_name,user_email,user_profile_photo,user_birthday,user_age,user_nickname,motto from users where user_id=?', [item.friend_id])
        item.friendInfo = user[0]
    }
    ctx.results.success({ message }, '请求成功')
})
module.exports = router.routes();
