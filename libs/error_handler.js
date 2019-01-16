module.exports=app=>{
  app.use(handler);
};

async function handler(ctx, next){
  try{
    await next();
  }catch(e){
    console.log(e);
    ctx.body='服务器正在维护中，请稍候重试';
  }
}
