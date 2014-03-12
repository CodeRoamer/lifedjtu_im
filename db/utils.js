

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


