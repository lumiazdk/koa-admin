const Router = require('koa-router');
const moment = require('moment')
let router = new Router();

//添加post
router.post('addPost', async ctx => {
    let { cid, aid, content, title, create_time = new Date(), update_time = new Date(), describes, background } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        aid: { type: "required" },
        title: { type: "required" },
        describes: { type: "required" },
        background: { type: "required" },
        content: { type: "required" },
        cid: { type: "required" },

    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    if (background) {
        background = `http://127.0.0.1:8080/${ctx.request.files[0].path.split('\\').reverse()[0]}`
    }
    let isAid = await ctx.db.query('select * from users where user_id=?', [aid])
    if (isAid.length == 0) {
        ctx.results.error('该用户不存在')
    } else {
        await ctx.db.query('insert into post (aid,title,content,background,create_time,update_time,cid,describes) values (?,?,?,?,?,?,?,?)', [aid, title, content, background, create_time, update_time, cid, describes])
        ctx.results.success({}, '添加成功')
    }

})

//添加分类
router.post('addCategory', async ctx => {
    let { name } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        name: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let ishave = await ctx.db.query('select * from category where name=?', [name])
    if (ishave.length > 0) {
        ctx.results.error('该分类已存在')
    } else {
        await ctx.db.query('insert into category (name) values (?)', [name])
        ctx.results.success({}, '添加成功')
    }
})
//获取分类
router.post('getAllCategory', async ctx => {
    let data = await ctx.db.query('select * from category')

    ctx.results.success({ data }, '获取成功')
})
//添加标签
router.post('addTag', async ctx => {
    let { name } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        name: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let ishave = await ctx.db.query('select * from tag where name=?', [name])
    if (ishave.length > 0) {
        ctx.results.error('该标签已存在')
    } else {
        await ctx.db.query('insert into tag (name) values (?)', [name])
        ctx.results.success({}, '添加成功')
    }
})

//打标签
router.post('addTagToPost', async ctx => {
    let { postid, tagid } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        postid: { type: "required" },
        tagid: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let isHave = await ctx.db.query('select * from tag_relationship where tagid=? and postid=?', [tagid, postid])
    let isLength = await ctx.db.query('select * from tag_relationship where postid=?', [postid])

    if (isHave.length > 0) {
        ctx.results.error('该标签已存在')
        return
    } else if (isLength.length > 3) {
        ctx.results.error('标签不能超过4个')
        return
    }
    let ispost = await ctx.db.query('select * from post where id=?', [postid])
    let istag = await ctx.db.query('select * from tag where tid=?', [tagid])
    if (ispost.length == 0) {
        ctx.results.error('该文章不存在')
    } else if (istag.length == 0) {
        ctx.results.error('该标签不存在')
    } else {
        await ctx.db.query('insert into tag_relationship (postid,tagid) values (?,?)', [postid, tagid])
        ctx.results.success({}, '添加成功')
    }
})

//获取博文
router.post('getPost', async ctx => {
    let { page, pageSize, where, user_id } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        page: { type: "required" },
        pageSize: { type: "required" },
        user_id: { type: "required" },


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
    let data = await ctx.db.query(`select * from post ${searchQuery} limit ?,?`, [start, parseInt(pageSize)])
    let result = []
    for (let item of Array.from(data)) {
        let data = await ctx.db.query(`select name,tid,postId from tag_relationship,tag,post where postId=? and tag.tid=tag_relationship.tagid and tag_relationship.postid=post.id`, [item.id])
        let user = await ctx.db.query(`select user_name,user_id,user_profile_photo,user_nickname from users where user_id=?`, [item.aid])
        let fabulous = await ctx.db.query(`select * from fabulous where fabulousUser_id=? and post_id=?`, [user_id, item.id])
        if (fabulous.length == 0) {
            item.isfabulous = false
        } else {
            item.isfabulous = true
        }
        item.tagInfo = data
        item.user = user[0]
        result.push(item)
    }
    let total = await ctx.db.query('select count(*) from post')
    let pageInfo = {
        total: total[0]['count(*)'],
        page,
        pageSize
    }
    ctx.results.success({ result, pageInfo })
})

//删除分类
router.post('deleteCategory', async ctx => {
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
    let ishave = await ctx.db.query('select * from category where categoryId=?', [id])
    if (ishave.length == 0) {
        ctx.results.error('暂无此分类！')
        return
    }
    let result = await ctx.db.query('delete from category where categoryId=?', [id])
    ctx.results.success({}, '删除成功！')
})

//更新分类
router.post('updateCategory', async (ctx) => {


    let { id, name } = ctx.request.fields ? ctx.request.fields : {};
    let body = ctx.request.fields ? ctx.request.fields : {}

    let schema = {
        id: { type: "required" },
        name: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let ishave = await ctx.db.query(`select * from category  where categoryId=?`, [id])
    if (ishave.length == 0) {
        ctx.results.error('暂无此分类')
        return
    }
    await ctx.db.query(`update category set name=? where categoryId=?`, [name, id])
    ctx.results.success()

})

//删除标签
router.post('deleteTag', async ctx => {
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
    let ishave = await ctx.db.query('select * from tag where tid=?', [id])
    if (ishave.length == 0) {
        ctx.results.error('暂无此标签！')
        return
    }
    let result = await ctx.db.query('delete from tag where tid=?', [id])
    ctx.results.success({}, '删除成功！')
})

//更新标签
router.post('updateTag', async (ctx) => {


    let { id, name } = ctx.request.fields ? ctx.request.fields : {};
    let body = ctx.request.fields ? ctx.request.fields : {}
    let schema = {
        id: { type: "required" },
        name: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let ishave = await ctx.db.query(`select * from tag  where tid=?`, [id])
    if (ishave.length == 0) {
        ctx.results.error('暂无此标签')
        return
    }
    await ctx.db.query(`update tag set name=? where tid=?`, [name, id])
    ctx.results.success()

})
//添加评论
router.post('addComment', async ctx => {
    let { comment_id, post_id, user_id, create_time = moment().format("YYYY-MM-DD HH:mm:ss"), update_time = moment().format("YYYY-MM-DD HH:mm:ss"), content, father_id } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}
    let schema = {
        post_id: { type: "required" },
        user_id: { type: "required" },
        content: { type: "required" },
        father_id: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }

    // if (!post_id) {
    //     ctx.results.error('id不能为空！')
    //     return false;
    // }
    // if (!user_id) {
    //     ctx.results.error('user_id不能为空！')
    //     return false;
    // }
    // if (!content) {
    //     ctx.results.error('content不能为空！')
    //     return false;
    // }
    // if (!father_id) {
    //     ctx.results.error('father_id不能为空！')
    //     return false;
    // }
    let is_post_id = await ctx.db.query('select * from post where id=?', [post_id])
    if (is_post_id.length == 0) {
        ctx.results.error('此文章不存在')
        return false;

    }
    let is_user_id = await ctx.db.query('select * from users where id=?', [user_id])
    if (is_user_id.length == 0) {
        ctx.results.error('此用户不存在')
        return false;
    }
    if (father_id != -1) {
        let is_father_id = await ctx.db.query('select * from users where id=?', [father_id])
        if (is_father_id.length == 0) {
            ctx.results.error('此评论用户不存在')
            return false;

        }
    }
    await ctx.db.query('insert into comment ( post_id, user_id,create_time,update_time,content,father_id) values (?,?,?,?,?,?)', [post_id, user_id, create_time, update_time, content, father_id])
    ctx.results.success({}, '添加成功')
})
//获取评论
router.post('getComment', async ctx => {
    let { post_id } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}
    let schema = {
        post_id: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let commentData = await ctx.db.query('select * from comment where post_id=?', [post_id])
    let result = []
    for (let item of commentData) {
        let userInfo = await ctx.db.query('select name,id from users where id=?', [item.user_id])
        if (item.father_id != -1) {
            fatherInfo = await ctx.db.query('select name,id from users where id=?', [item.father_id])
            item.fatherInfo = fatherInfo

        }
        item.userInfo = userInfo

        result.push(item)
    }
    ctx.results.success({ result }, '获取成功')


})

//点赞
router.post('addFabulous', async (ctx) => {
    let { post_id, fabulousUser_id, create_time = new Date(), update_time = new Date() } = ctx.request.fields ? ctx.request.fields : {}
    let body = ctx.request.fields ? ctx.request.fields : {}
    let schema = {
        post_id: { type: "required" },
        fabulousUser_id: { type: "required" },
    }
    let errors = ctx.json_schema(body, schema)
    if (errors) {
        ctx.results.jsonErrors({ errors })
        return
    }
    let isHave = await ctx.db.query('select * from  fabulous where post_id=? and  fabulousUser_id=?', [post_id, fabulousUser_id])
    if (isHave.length == 0) {
        await ctx.db.query('insert into fabulous ( post_id, fabulousUser_id,create_time,update_time ) values (?,?,?,?)', [post_id, fabulousUser_id, create_time, update_time])
        ctx.results.success({}, '点赞成功')

    } else {
        let result = await ctx.db.query('delete from fabulous where post_id=? and  fabulousUser_id=?', [post_id, fabulousUser_id])
        ctx.results.success({}, '取消点赞成功')

    }
})
module.exports = router.routes();
