const Router = require('koa-router');
var assert = require('assert');
const request = require('superagent')
require('superagent-charset')(request)
const cheerio = require('cheerio');
var iconv = require('iconv-lite');
let router = new Router();
router.post('getyueduwen', async (ctx) => {
    let data = [];
    for (let p = 2; p < 5; p++) {
        const reptileUrl = `https://www.yueduwen.com/a/tupian/list_17_${p}.html`;
        let url = await request.get(reptileUrl).charset('gbk').buffer(true).set('Accept-Language', 'zh-CN,zh;q=0.8');
        let $ = cheerio.load(url.text);
        $('.mlist').each((i, item) => {
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
    }

    console.log('抓取成功')
    ctx.results.success({ data }, '成功')
})
router.post('tuweng', async (ctx) => {
    let data = [];
    for (let p = 2; p < 5; p++) {
        const reptileUrl = `http://www.tuweng.com/pic/index_${p}.html`;
        let url = await request.get(reptileUrl).charset('gbk').buffer(true).set('Accept-Language', 'zh-CN,zh;q=0.8');
        let $ = cheerio.load(url.text);
        $('.TuWen_nr .lm').each((i, item) => {
            let _this = $(item);
            data.push({
                title: _this.find('.doc h5 a').text(),
                describes: _this.find('.doc p').text(),
                background: `${_this.find('.photo img').attr('src')}`,
                id: `${_this.find('a.photo').attr('href')}`

            })
            console.log(`查到${i + 1}条,标题：${data[i].title}`)

        });
        //子页
        for (let i = 0; i < data.length; i++) {

            if (!data[i].title) {
                data.splice(i, 1)
                continue
            }
            let pageurl = await request.get(data[i].id).charset('gbk').buffer(true)
            let page = cheerio.load(pageurl.text);
            page('#DocContent p img').each((v, item) => {
                let old = page(item).attr('src')
                page(item).attr('src', `${old}`)
            })
            if (page('.content').html()) {
                data[i].content = page('.content').html()

            } else {
                data[i].content = `<p style="line-height:1.5em;margin-top:15px;margin-bottom:5px;"><span style="font-size:14px;"><span style="font-size:14px;font-family:΢���ź�, 'microsoft yahei';">　　</span><strong><span style="font-size:14px;font-family:΢���ź�, 'microsoft yahei';">暂无内容</span></strong></span></p>`
            }
            console.log(`查到${i + 1}条内容,标题：${data[i].title}`)
        }
        let { forward_num, postId, cid, aid, content, title, create_time = new Date(), update_time = new Date(), describes, background, type } = ctx.request.fields ? ctx.request.fields : {}
        for (let i = 0; i < data.length; i++) {
            let item = data[i]
            await ctx.db.query('insert into post (aid,title,content,background,create_time,update_time,cid,describes) values (?,?,?,?,?,?,?,?)', [23, item.title, item.content, item.background, create_time, update_time, 9, item.describes])
            console.log(`插入${i + 1}条内容,标题：${data[i].title}`)
        }
    }

    console.log('抓取成功')
    ctx.results.success({ data }, '成功')
})
module.exports = router.routes();
