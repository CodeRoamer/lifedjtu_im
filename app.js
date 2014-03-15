/*
    This is only for test
 */

var utils = require("./db/utils"),
    db = require("./db");

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


console.log(utils.uuid());