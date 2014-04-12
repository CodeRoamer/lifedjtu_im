/**
 * Created by Li He on 2014/4/12.
 */

var dv = require('dv')               //node-dv
    , fs = require('fs')           //file system module
    , utils = require('../db/utils');

/**
 * This function dedicate to be a handler of express for cracking code
 * @param req request
 * @param res response
 */
var crack = function(req, res) {
    var studentId = req.params.studentId;
    var password = req.query.randomCode; //password actually

    var times = 15; //15 times tries

    function next(err, sessionId, initial){
        //console.log(times+" times trying to fetch code with userId: "+studentId);
        if(times--<0){
            res.end("Times Try Out!"); //failed
            return; //add return to stop the invocation
        }

        //error here occurs during the request, should not stop the temptation.
        if(!err&&!initial){
            res.end(sessionId); //successful session Id
            return; //add return to stop the invocation
        }

        utils.fetchCodeAndSessionId(function(err, sessionId, buffer){
            if(err){
                console.log(err);  //this err should end the request
                res.end("error occurs");
                return; //add return to stop the invocation
            }

            var image = new dv.Image('jpg', buffer);
            image = image.toGray(0.2,0.75,0.05);

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

            utils.signinRemote(studentId,password,damnCode,sessionId,next);
        });
    }

    next(null,null,true);

};

exports = module.exports = crack;