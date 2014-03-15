

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
    var re = /:([a-zA-Z0-9_-]+)/gm
        ,m;

    while((m=re.exec(sql))){
        //console.log(m);
        sql = sql.replace(m[0],"'"+params[m[1]]+"'");
        //console.log(sql);

    }
    return sql;
}


var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

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