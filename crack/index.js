/**
 * Created by Li He on 2014/4/12.
 */

var dv = require('dv')               //node-dv
    , fs = require('fs')           //file system module
    , utils = require('../db/utils');

var crack = function(req, res) {
    var studentId = req.params.studentId;
    var password = req.query.randomCode; //password actually

    var times = 15; //20 times tries

    function next(err, sessionId, initial){
        if(times--<0){
            res.end("Time Try Out!"); //failed
            return;
        }

        if(!err&&!initial){
            res.end(sessionId); //successful session Id
            return;
        }

        utils.fetchCodeAndSessionId(function(err, sessionId){
            if(err){
                //this err should end the request
                console.log(err);
                res.end("error occurs");
                return;
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

            //fix our code
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

            //console.log(damnCode);
            fs.unlink('./temp/'+sessionId+'.jpg', function(err){
                if(err){
                    console.log("error delete our temp image file:\n"+err);
                }
            });
            utils.signinRemote(studentId,password,damnCode,sessionId,next);
        });
    }

    next(null,null,true);

};

exports = module.exports = crack;