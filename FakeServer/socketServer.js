var http = require('http');
const httpServer = http.createServer();
const io = require("socket.io")(httpServer, {
    // ...
  });
  

io.on("connection", (socket) => {
    msg = {
        username: "mt",
        message: "mt has joint."
    };
    // console.log('connect', JSON.stringify(msg))
    io.emit('connect', JSON.stringify(msg))
    newuser = [
        {
            socketId: 1,
            username: "jwl",
            portrait: { id: 5, jacket: 1, pants: 1 }
        }
    ]
    // console.log('newuser', JSON.stringify(newuser))
    io.emit('newuser', JSON.stringify(newuser))

    socket.on('message', function (socket) {

        msg = {
            username: "mt",
            message: "mt has message."
        };
        // console.log('message', JSON.stringify(msg))
        socket.emit('connect', JSON.stringify(msg))
    });

    socket.on('try_answer', function (socket) {

        msg = {
            winnerId: 1,
            achievement:[]
        };
        console.log('victory')
        socket.emit('victory', JSON.stringify(msg))
    });
});

port =8081
httpServer.listen(port);
console.log('server is running on '+port)
