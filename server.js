var app = require('express')()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)
    , db = require('./db')
    , utils = require('./db/utils');

server.listen(1222);

/************************* tesseract part **************************/

var dv = require('dv');
var fs = require('fs');

app.get('/fetchCodeAndSessionId/:studentId',function(req, res){
    var studentId = req.params.studentId;
    var password = req.query.randomCode;

    var times = 10;

    function next(err, sessionId, initial){
        if(times--<0){
            res.end("Time Try Out!");
            return;
        }

        if(!err&&!initial){
            res.end(sessionId);
            return;
        }

        utils.fetchCodeAndSessionId(function(err, sessionId){
            if(err){
                //this err should end the request
                res.end(err);
            }

            var image = new dv.Image('jpg', fs.readFileSync('./temp/'+sessionId+'.jpg'));
            var open = image.thin('bg', 8, 5).dilate(3, 3);
            var openMap = open.distanceFunction(8);
            var openMask = openMap.threshold(10).erode(22, 22);
            var boxes = openMask.invert().connectedComponents(8);
            for (var i in boxes) {
                var boxImage = image.crop(
                    boxes[i].x, boxes[i].y,
                    boxes[i].width, boxes[i].height);
                // Do something useful with our image.
            }

            var tesseract = new dv.Tesseract('eng', image);
            var tempCode = tesseract.findText('plain');

            var damnCode = '';
            for(var index in tempCode){
                if(tempCode[index]==' '||/[^a-zA-Z0-9]/.test(tempCode[index])){
                    continue;
                }else if(tempCode[index]=='I'){
                    damnCode+='1';
                }else if(tempCode[index]=='D'){
                    damnCode+='0';
                }else if(tempCode[index]=='S'){
                    damnCode+='5';
                }else{
                    damnCode+=tempCode[index];
                }
            }

            console.log(damnCode);
            fs.unlink('./temp/'+sessionId+'.jpg', function(err){
               if(err){
                   console.log(err);
               }
            });
            utils.signinRemote(studentId,password,damnCode,sessionId,next);
        });
    }

    next(null,null,true);

});



/************************** websocket part ******************************/
//全局变量
var socketMap = {};
var userAuth = {};

//setInterval(function(){
//    console.log(JSON.stringify(userAuth));
//},20000);

//error code: 0代表用户错误，1代表认证问题，需要重登录，2代表服务器错误

io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file
io.set('log level', 1);                    // reduce logging

// enable all transports (optional if you want flashsocket support, please note that some hosting
// providers do not allow you to create servers that listen on a port different than 80 or their
// default port)
io.set('transports', [
    'websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
]);


var num = 0;
setInterval(function(){
    console.log("socket number:"+num);
},600000);

io.sockets.on('connection', function (socket) {
    num++;

    socket.emit('ready');

    //first event: online event
    socket.on('online', function(data){
//        data structure should be...
//        var data = {
//            "studentId":1018110323,
//            "dynamicPass":'xxxxxxxxxxxxx'
//        };

        if(!data||!data.studentId){
            socket.emit('error',{errorCode:0,message:"no studentId provided"});
            socket.disconnect();
            return;
        }

        //bind studentId to socket, let socket know who it is
        socket.set('studentId', data.studentId, function(){
            console.log('studentId:'+data.studentId+" is set");
        });
        db.checkUser(data.studentId,data.dynamicPass,function(err, result){
            if(err||!result.success){
                socket.emit('error',{errorCode:1,message:"user access refused, re-signin please!",detail:err});
                socket.disconnect();
                return;
            }

            if(result.success){
                //提醒其他用户此用户已经在线
                if(!socketMap[data.studentId]){
                    db.grabRelatedGroupUsers(data.studentId,function(err, idArray){
                        if(err){
                            socket.emit('error',{errorCode:2,message:"database error, don't know what goes wrong! cannot notify your online messages",detail:err});
                            //socket.disconnect();
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
                        socket.emit('error',{errorCode:2,message:"cannot grab your unread messages!",detail:err});
                        //socket.disconnect();
                        return;
                    }

                    for(var index in messages){
                        socket.emit('say',messages[index]);
                    }

                    db.updateUnreadMessages(data.studentId,function(err){
                        if(err){
                            socket.emit('error',{errorCode:2,message:"cannot update your unread messages' status!",detail:err});
                            //socket.disconnect();
                            return;
                        }
                    });
                });
                //更新用户在线状态
                db.updateIMStatusForUser(data.studentId,1/*online*/,function(err){
                    if(err){
                        socket.emit('error',{errorCode:2,message:"cannot update your online status!",detail:err});
                        //socket.disconnect();
                        return;
                    }
                });
            }
        });

    });

    socket.on('say',function(data){
        //save auth for future features 验证用户是否通过了验证！
        if(data.messageSource&&socketMap[data.messageSource]){

            //messageDes(array),messageSource,imGroupFlag,imGroupId,messageContent,messageDate
            //群组用户不指望用户来传，自己抓取！！
            if(data.imGroupFlag=='1'){
                db.grabUsersInGroup(data.messageDes,data.imGroupId,function(err,studentIdArray){
                    if(err){
                        socket.emit('error',{errorCode:2,message:"cannot grab users in group! what's up?",detail:err});
                        return;
                    }
                    //console.log("in SAY: "+studentIdArray);
                    for(var index in studentIdArray){
                        if(studentIdArray[index]==data.messageSource)
                            continue;
                        sayToUser(studentIdArray[index],data);
                    }

                });
            }else{
                sayToUser(data.messageDes,data);
            }


        }

    });

    socket.on('offline',function(){
        socket.disconnect();
    });

    socket.on('disconnect',function(){
        num--;
        function makeOffline(){
            socket.get('studentId', function (err, studentId) {
                if(err||!studentId){
                    console.log("ON Disconnect: "+err);
                    console.log("ON Disconnect - studentId: "+studentId);
                    return;
                }
                //提醒其他用户此用户已经在线
                if(socketMap[studentId]){
                    db.grabRelatedGroupUsers(studentId,function(err, idArray){
                        if(err){
                            console.log("ON Disconnect - studentId: cannot grab related users for studentId:"+ studentId+"\nerror detail: "+err);
                            return;
                        }

                        for(var index in idArray){
                            if(socketMap[idArray[index]]){
                                socketMap[idArray[index]].emit('system',{type:'offline',data:{studentId:studentId}});
                            }
                        }
                    });

                }
                //添加用户数据，方便以后使用
                socketMap[studentId] = undefined;
                userAuth[studentId] = undefined;
                //更新用户在线状态，下线
                db.updateIMStatusForUser(studentId,0/*offline*/,function(err){
                    if(err){
                        console.log("ON Disconnect - studentId: cannot update user's offline status for studentId:"+ studentId+"\nerror detail: "+err);
                        return;
                    }
                });
                console.log('user off line!!! '+studentId);
            });

        }


        var timeoutId = setTimeout(makeOffline,0);

    });

    /**
     * util method
     * say somthing to user
     **/
    var sayToUser = function(studentId,data){
        //console.log(studentId+": about to say to him/her");

        var message = {
            messageDes: '',
            messageSource:data.messageSource,
            imGroupFlag:data.imGroupFlag,
            imGroupId:data.imGroupId,
            messageContent:data.messageContent,
            messageDate:data.messageDate //long
        };

        message.messageDes = studentId;
        message.id = '';

        if(socketMap[studentId]){
            //messageDes,messageSource,imGroupFlag,imGroupId,messageContent,messageDate
            //say to user directly
            socketMap[studentId].emit('say',message);
        }else{
            message.id = utils.uuid();
            message.readFlag = 0;
            message.messageDate = utils.formatDate(message.messageDate);
            //save to the database

            db.addInstantMessageForUser(message,function(err){
                if(err){
                    console.log(err);
                    socket.emit('error',{errorCode:2,message:"cannot push you message to the destination user's message box",detail:err});
                    return;
                }
            });
        }
    }


});


//以下都是为了能够让网页可以被访问

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
