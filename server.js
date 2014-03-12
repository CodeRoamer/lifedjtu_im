var app = require('express')()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)
    , db = require('./db');

server.listen(9119);

//全局变量
var socketMap = {};
var userAuth = {};

io.sockets.on('connection', function (socket) {

    socket.on('online', function(data){
//        data structure should be...
//        var data = {
//            "studentId":1018110323,
//            "dynamicPass":'xxxxxxxxxxxxx'
//        };
        db.checkUser(data.studentId,data.dynamicPass,function(err, result){
            if(err||!result.success){
                //disconnect the user!!!
                return;
            }

            if(result.success){
                if(!socketMap[data.studentId]){
                    db.grabRelatedGroupUsers(data.studentId,function(err, idArray){
                        if(err){
                            //disconnect the user!!!
                            return;
                        }

                        for(var index in idArray){
                            if(socketMap[idArray[index]]){
                                socketMap[idArray[index]].emit('system',{type:'online',data:{studentId:data.studentId}});
                            }
                        }
                    });

                }
                socketMap[data.studentId] = socket;
                userAuth[data.studentId] = result.privateKey;

                db.grabUnreadMessages(data.studentId,function(err,messages){
                    if(err){
                        //disconnect the user!!!
                        return;
                    }

                    for(var index in messages){
                        socket.emit('say',messages[index]);
                    }

                    db.updateUnreadMessages(data.studentId,function(err){
                        if(err){
                            //disconnect the user!!!
                            return;
                        }
                    });
                });

            }
        });

    });

    socket.on('say',function(data){

    });

});



var fs = require('fs');

require('http').createServer(handler).listen(18080);

function handler (req, res) {
    var regx = /\/res\/.*/;
    if(regx.test(req.url)){
        fs.readFile(__dirname + req.url,
            function (err, data) {
                if (err) {
                    res.writeHead(500);
                    return res.end('Error loading index.html');
                }

                res.writeHead(200);
                res.end(data);
            });
    }else{
        fs.readFile(__dirname + '/index.html',
            function (err, data) {
                if (err) {
                    res.writeHead(500);
                    return res.end('Error loading index.html');
                }

                res.writeHead(200);
                res.end(data);
            });
    }

}
