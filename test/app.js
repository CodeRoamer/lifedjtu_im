/*
    This is only for test
 */

var utils = require("././utils"),
    db = require("././index"),
    config = require("././config");

var dv = require("dv")
    , fs = require("fs");

var image = new dv.Image('jpg', fs.readFileSync("getCaptcha.jpg"));

//my change occurs here
image = image.toGray(0.2,0.75,0.05);

fs.writeFileSync("tweakedImage.jpg",image.toBuffer('jpg'));

//console.log(utils.fillNamedSql("select id,studentId,privateKey from user where studentId=:studentId and dynamicPass=:pass",{
//    studentId:'1018110323',
//    pass:'123456jfdka'
//}));


//db.grabRelatedGroupUsers('1018110323',function(err,result){
//    if(err){
//        console.log(err);
//    }
//    console.log(result);
//});

//db.grabUnreadMessages('1018110323',function(err,result){
//    console.log(result);
//});

//
//var sql = utils.fillNamedSql(config.addInstantMessageForUser,{"messageDes":"1018110329","messageSource":"1018110323","imGroupFlag":"1","imGroupId":"8dc42722-a471-414b-a8d8-1ad2c967002b","messageContent":"你好~~","messageDate":1395040873844,"id":"2BC81486-A646-4859-BD9F-E993FBB9B55C","readFlag":0});
//
//console.log(sql);

//utils.fetchCodeAndSessionId(function(err, sessionId){
//    if(err){
//        console.log(err);
//    }
//
//    console.log(sessionId);
//});


//utils.signinRemote("1018110323","lh911119","91846","8964E81A67EE6ADEC63764AF437CD345",function(err,sessionId){
//    if(err){
//        console.log(err);
//    }
//
//    console.log(sessionId);
//});