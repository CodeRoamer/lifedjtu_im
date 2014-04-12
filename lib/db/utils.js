
var http = require('http'),
    fs = require('fs');

/**
 * 创建动态密钥
 * @param privateKey
 * @returns {*}
 */
exports.createDynamicPass = function(privateKey){
    return privateKey;
}


/**
 * param should be like this:
 * {
 *  “key”:value,
 *  "key2":value2,
 *  ...
 * }
 * @param params
 */
exports.fillNamedSql = function(sql,params){
    var re = /:([a-zA-Z0-9_\-]+)/gm
        ,m;

    m = sql.match(re);

    for(var index in m){
        sql = sql.replace(m[index],"'"+params[m[index].substring(1)]+"'");
    }
    //console.log(JSON.stringify(params));
    //console.log(sql);
    return sql;
}


var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
/**
 * 生成uuid
 * @param len
 * @param radix
 * @returns {string}
 */
exports.uuid = function (len, radix) {
    var chars = CHARS, uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
        // rfc4122, version 4 form
        var r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random()*16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
};

exports.formatDate = function(time){
    var date = new Date();
    date.setTime(parseInt(time));

    return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
};



/**
 *
 * @param callback function(err,sessionId)
 */
exports.fetchCodeAndSessionId = function(callback){
    var options = {
        hostname: '202.199.128.21',
        port: 80,
        path: '/academic/getCaptcha.do',
        method: 'GET'
    };
    var req = http.request(options, function(res) {
        if(res.statusCode==200){
            var m = res.headers["set-cookie"][0].match(/JSESSIONID=([^;]+)/);
            var sessionId = m[1];

            var imageBuffer = new Buffer(0);

            res.on('data', function (buffer) {
                imageBuffer = Buffer.concat([imageBuffer,buffer]);
            });

            res.on('end', function(){
                callback(null, sessionId, imageBuffer);
            });


        }else{
            callback({
                statusCode:res.statusCode,
                message : "status code not 200, bad request"
            });
        }

    });
    req.on('error', function(e) {
        console.log('problem with request: ' + e);
        callback({
            statusCode:res.statusCode,
            message : "request error"
        });
    });

    // write data to request body
    req.end();
};

/**
 * sign in remote, use the given cracked code
 * @param studentId
 * @param password
 * @param damnCode
 * @param sessionId
 * @param callback
 */
exports.signinRemote = function(studentId, password, damnCode, sessionId, callback){
    var postData = "j_username="+studentId+"&j_password="+password+"&j_captcha="+damnCode;

    var options = {
        hostname: '202.199.128.21',
        port: 80,
        path: "/academic/j_acegi_security_check",//?j_username="+studentId+"&j_password="+password+"&j_captcha="+damnCode,
        method: 'POST',
        headers:{
            "Cookie": "JSESSIONID="+sessionId,
            "Content-Length": Buffer.byteLength(postData, 'utf8'),
            "Content-Type": 'application/x-www-form-urlencoded'
        }
    };

    var req = http.request(options, function(res) {
        res.setEncoding("utf8");

        //console.log(JSON.stringify(res.headers.location));
        if(/.*login\.jsp.*/.test(res.headers.location)){
            callback({
                statusCode:"302",
                message: "login failed"
            },sessionId);
        }else{
            callback(null,sessionId);
        }
    });
    req.on('error', function(e) {
        console.log('Signin Remote problem with request: ' + e);
        callback({
            statusCode:"500",
            message: "request error"
        },sessionId);
    });

    req.write(postData);
    req.end();
};

