/*
  created by Lihe
 */

var config = {
    database:{
        name:"mysql",
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'lifedjtu',
        port: 3306
    }
};

exports = module.exports = config;

exports.checkUser = "select id,studentId,privateKey from User where studentId=:studentId";
exports.grabRelatedGroupUsers = "select distinct(studentId) from IMGroupUser where imGroupId in (select distinct imGroupId from IMGroupUser where studentId=:studentId) and studentId!=:studentId";
exports.grabUnreadMessages = "SELECT * FROM InstantMessage where messageDes=:studentId and readFlag=0";
exports.updateUnreadMessages = "update InstantMessage set readFlag=1 where messageDes=:studentId";