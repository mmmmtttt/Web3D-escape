var http = require('http'); // 1 - Import Node.js core module

var server = http.createServer(function (req, res) {   // 2 - creating server
    res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');

    //handle incomming requests here..
    if (req.url == '/user/login') { //check the URL of the current request
        console.log("login request");
        // set response header
        res.writeHead(403);
        res.write('{"status":"1","token":"123"}');
        res.end();
    }
    else if (req.url == "/user/register") {
        console.log("register request");
        res.writeHead(403);
        res.end();

    }
    else if(req.url=="/user/rooms"){
        console.log("get rooms");
        res.writeHead(200);
        res.end('[{"id":1,"name":"room1","intro":"intro1"}, {"id":2,"name":"room2","intro":"intro2"},{"id":3,"name":"room3","intro":"intro3"},{"id":4,"name":"room4","intro":"intro4"},'+
        '{"id":5,"name":"room5","intro":"intro5"}, {"id":6,"name":"room6","intro":"intro6"},{"id":7,"name":"room7","intro":"intro7"},{"name":"room8","intro":"intro8"}]');
    }
    else if(req.url=="/user/profile"){
        console.log("get profile");
        res.writeHead(200);
        res.end('{"username":"mtt","gender":"0","portraitId":5}');
    }
    else if(req.url=="/user/attributes"){
        console.log("get attributes");
        res.writeHead(200);
        res.end('{"correct":3,"wrong":2,"CA":30,"CN":20,"Cypher":20,"DS":30,"Other":10}');
    }
    else if(req.url=="/user/records"){
        console.log("get records");
        res.writeHead(200);
        res.end('[{"roomId":1,"checkpointId":1,"tag":"Computer Network","trail",4,"result":"success"},{"roomId":1,"checkpointId":1,"tag":"Computer Network","trail",4,"result":"success"},{"roomId":1,"checkpointId":1,"tag":"Computer Network","trail",4,"result":"success"}]');
    }else {
        console.log("other request");
        res.writeHead(200);
        res.end('Invalid Request!');
    }

});

var port = 8282;
server.listen(port); //3 - listen for any incoming requests

console.log('Node.js web server at port '+port +' is running..')