/**
 * Created by apple on 4/12/14.
 */
var express = require('express') //express framework
    , app = express()               // express instance
    , server = require('http').createServer(app)  //server instance
    , crack = require('./crack');

/**
 * port to listen
 */
server.listen(18080);

/************************* web page part ***************************/

app.all('/',function(req,res){
    res.send("<h1>Welcome to LifeDjtu Instant Message System</h1><p>This Page is not desired to be visited. Click <a href='http://lifedjtu.duapp.com'>here</a> to visit our home page.</p>");
});

/************************* tesseract part **************************/

app.get('/fetchCodeAndSessionId/:studentId', crack);
