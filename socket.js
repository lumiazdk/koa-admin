
module.exports = function SocketIO(io, db) {
    global.userServer = {};//服务
    let userList = {}; //nickname列表
    let freeList = [];//user_id列表
    let count = 0;//连接数量
    let rooms = []//房间
    //连接
    io.on('connection', function (socket) {
        count += 1;
        socket.on('newUser', function (data) {
            console.log('newUser')
            console.log(data)
            let nickname = data.user_name,
                user_id = data.user_id;
            socket.id = user_id;
            global.userServer[user_id] = socket;
            userList[user_id] = nickname
            freeList.push(user_id)

        })
        //退出
        socket.on('disconnect', function () {
            console.log('disconnect')
            count -= 1;
            let id = socket.id
            Arrayremove(freeList, id)
            delete userServer[id]
            delete userList[id]
        })
        socket.on('getMessage', function (data) {
            if (global.userServer.hasOwnProperty(data.user_id)) {
                global.userServer[data.user_id].emit('getMessage')
            } else {
                socket.emit("err", { msg: "对方已经下线或者断开连接" })
            }
        })

    })

    function Arrayremove(array, name) {
        let len = array.length;
        for (let i = 0; i < len; i++) {
            if (array[i] == name) {
                array.splice(i, 1)
                break
            }
        }
    }
}