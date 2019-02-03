const Router = require('koa-router');
var assert = require('assert');
const request = require('superagent')
require('superagent-charset')(request)
const cheerio = require('cheerio');
var iconv = require('iconv-lite');
let router = new Router();
router.post('getst', async (ctx) => {
    let data = [];
    const reptileUrl = "https://www.yueduwen.com/a/tupian/";
    let url = await request.get(reptileUrl).charset('gbk').buffer(true).set('Accept-Language', 'zh-CN,zh;q=0.8');
    let $ = cheerio.load(url.text);
    var t = $('.mlist')
    var t2 = t.nextAll();
    t2.each((i, item) => {
        let _this = $(item);
        data.push({
            title: _this.find('.mlist-content h2 a').text(),
            describes: _this.find('.mlist-content p').text(),
            background: `https://www.yueduwen.com${_this.find('.mlist-img img').attr('src')}`,
            id: `https://www.yueduwen.com${_this.find('.mlist-content h2 a').attr('href')}`

        })
        console.log(`查到${i}条`)

    });
    //子页
    for (let i = 0; i < data.length; i++) {
        let pageurl = await request.get(data[i].id).charset('gbk').buffer(true)
        let page = cheerio.load(pageurl.text);
        page('tbody center img').each((i, item) => {
            let old = page(item).attr('src')
            page(item).attr('src', `https://www.yueduwen.com${old}`)
        })
        data[i].content = page('tbody').html()
        console.log(`查到${i}条内容`)
    }
    let { forward_num, postId, cid, aid, content, title, create_time = new Date(), update_time = new Date(), describes, background, type } = ctx.request.fields ? ctx.request.fields : {}
    for (let i = 0; i < data.length; i++) {
        let item = data[i]
        await ctx.db.query('insert into post (aid,title,content,background,create_time,update_time,cid,describes) values (?,?,?,?,?,?,?,?)', [23, item.title, item.content, item.background, create_time, update_time, 7, item.describes])
        console.log(`插入${i}条内容`)

    }
    console.log('抓取成功')
    ctx.results.success({ data }, '成功')
})
module.exports = router.routes();
