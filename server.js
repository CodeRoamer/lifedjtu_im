var app = require('express')()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)
    , db = require('./db')
    , utils = require('./db/utils');

server.listen(1222);

//全局变量
var socketMap = {};
var userAuth = {};

io.sockets.on('connection', function (socket) {
    //first event: online event
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
                //提醒其他用户此用户已经在线
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
                //添加用户数据，方便以后使用
                socketMap[data.studentId] = socket;
                userAuth[data.studentId] = result.privateKey;
                //抓取未读信息，say 给用户
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
                //更新用户在线状态
                db.updateIMStatusForUser(data.studentId,1/*online*/,function(err){
                    if(err){
                        //disconnect the user!!!
                        return;
                    }
                });
            }
        });

    });

    socket.on('say',function(data){
        //save auth for future features 验证用户是否通过了验证！
        if(data.messageSource&&socketMap[data.messageSource]&&data.messageDes){
            var message = {
                messageDes: '',
                messageSource:data.messageSource,
                imGroupFlag:data.imGroupFlag,
                imGroupId:data.imGroupId,
                messageContent:data.messageContent,
                messageDate:data.messageDate
            };
            //messageDes(array),messageSource,imGroupFlag,imGroupId,messageContent,messageDate
            if(Array.isArray(data.messageDes)){
                for(var index in data.messageDes){
                    sayToUser(data.messageDes[index],message);
                }
            }else{
                sayToUser(data.messageDes,message);
            }
        }

    });

    socket.on('offline',function(data){
        socket.disconnect(data);
    });

    socket.on('disconnect',function(data){
        function makeOffline(){
            //提醒其他用户此用户已经在线
            if(socketMap[data.studentId]){
                db.grabRelatedGroupUsers(data.studentId,function(err, idArray){
                    if(err){
                        //disconnect the user!!!
                        return;
                    }

                    for(var index in idArray){
                        if(socketMap[idArray[index]]){
                            socketMap[idArray[index]].emit('system',{type:'offline',data:{studentId:data.studentId}});
                        }
                    }
                });

            }
            //添加用户数据，方便以后使用
            socketMap[data.studentId] = undefined;
            userAuth[data.studentId] = undefined;
            //更新用户在线状态，下线
            db.updateIMStatusForUser(data.studentId,0/*offline*/,function(err){
                if(err){
                    //disconnect the user!!!
                    return;
                }
            });
        }
        setTimeout(makeOffline,5000);
    });

});
/**
 * util method
 *
**/
 var sayToUser = function(studentId, message){
    message.messageDes = studentId;
    message.id = '';

    if(socketMap[studentId]){
        //messageDes,messageSource,imGroupFlag,imGroupId,messageContent,messageDate
        //say to user directly
        socketMap[studentId].emit('say',message);
    }else{
        message.id = utils.uuid();
        message.readFlag = 0;
        //save to the database
        db.addInstantMessageForUser(message,function(err){
            if(err){
                //....do something
                return;
            }
        });
    }
}


//以下都是为了能够让网页可以被访问
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
