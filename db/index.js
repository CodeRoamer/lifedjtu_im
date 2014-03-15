/*
 created by Lihe
 */

var config = require("./config"),
    mysql = require("mysql"),
    utils = require("./utils");


var pool = mysql.createPool(config.database);


/**
 * give studentId and dynamicPass check the validity of user
 * @param studentId
 * @param dynamicPass
 * @param (optional) callback
 */
exports.checkUser = function(studentId,dynamicPass,callback){
    pool.getConnection(function (err, conn) {
        //static code
        if (err){
            callback(err);
            return;
        }
        //end of static code
        conn.query(utils.fillNamedSql(config.checkUser,{
            studentId:studentId
        }),function(err,rows){
            //static code
            conn.release();
            if (err){
                callback(err);
                return;
            }
            //end of static code
            var result = {};

            if(rows.length>0){
                if(utils.createDynamicPass(rows[0].privateKey)==dynamicPass){
                    result.success = true;
                    result.privateKey = rows[0].privateKey;
                    callback(null,result);
                    return;
                }
            }
            result.success = false;
            callback(null,result);
        });
    });
};

/**
 * get all related group users' studentId
 * @param studentId
 * @param callback
 */
exports.grabRelatedGroupUsers = function(studentId,callback){
    pool.getConnection(function (err, conn) {
        //static code
        if (err){
            callback(err);
            return;
        }
        //end of static code
        conn.query(utils.fillNamedSql(config.grabRelatedGroupUsers,{
            studentId:studentId
        }),function(err,rows){
            //static code
            conn.release();
            if (err){
                callback(err);
                return;
            }
            //end of static code

            var studentIds = [];

            if(rows.length>0){
                for(var index in rows){
                    studentIds.push(rows[index].studentId);
                }
                callback(null,studentIds);
                return;
            }

            callback(null,studentIds);
        });
    });
};


exports.grabUnreadMessages = function(studentId, callback){
    pool.getConnection(function (err, conn) {
        //static code
        if (err){
            callback(err);
            return;
        }
        //end of static code
        conn.query(utils.fillNamedSql(config.grabUnreadMessages,{
            studentId:studentId
        }),function(err,rows){
            //static code
            conn.release();
            if (err){
                callback(err);
                return;
            }
            //end of static code

            var messageArray = [];

            if(rows.length>0){
                for(var index in rows){
                    messageArray.push(rows[index]);
                }
                callback(null,messageArray);
                return;
            }

            callback(null,messageArray);
        });
    });
};


exports.updateUnreadMessages = function(studentId, callback){
    pool.getConnection(function (err, conn) {
        //static code
        if (err){
            callback(err);
            return;
        }
        //end of static code
        conn.query(utils.fillNamedSql(config.updateUnreadMessages,{
            studentId:studentId
        }),function(err,res){
            //static code
            conn.release();
            if (err){
                callback(err);
                return;
            }
            //end of static code

            callback(null,res.rowsAffected);

        });
    });
};

/**
 * 更新用户在线状态，下线或上线
 * @param studentId
 * @param status 只能是0或1
 * @param callback （optional）
 */
exports.updateIMStatusForUser = function(studentId, status, callback){
    pool.getConnection(function (err, conn) {
        //static code
        if (err){
            callback(err);
            return;
        }
        //end of static code
        conn.query(utils.fillNamedSql(config.updateIMStatusForUser,{
            studentId:studentId,
            status:status
        }),function(err,res){
            //static code
            conn.release();
            if (err){
                callback(err);
                return;
            }
            //end of static code

            callback(null,res.rowsAffected);

        });
    });
};

exports.addInstantMessageForUser = function(message,callback){
    pool.getConnection(function (err, conn) {
        //static code
        if (err){
            callback(err);
            return;
        }
        //end of static code
        conn.query(utils.fillNamedSql(config.addInstantMessageForUser,message),function(err,res){
            //static code
            conn.release();
            if (err){
                callback(err);
                return;
            }
            //end of static code

            callback(null,res.rowsAffected);

        });
    });
};