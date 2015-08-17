/**
 * author zhengang.wei
 * 2015-8-11
 * @type {*}
 */
var http = require('http');
var fs = require('fs');
var path = require('path');
var mine = require('./node_modules/mime/mime.js');
var cache = {};
var chatServer = require('./lib/chat_server');

/**
 * create server, default page:index.html
 * @type {*}
 */
var server = http.createServer(function(request,response){
    var filePath = false;
    if(request.url == '/'){
        filePath = 'public/index.html';
    }else{
        filePath = 'public' + request.url;
    }
    var absPath = './' + filePath;
    serverStatic(response, cache, absPath);
});

chatServer.listen(server);

var listen_port = 3000;
server.listen(listen_port, function(){
    console.log("Server listening on port "+listen_port+".");
});

/**
 * if page not found, show the default 404 page
 * @param response the return response
 */
function send404(response){
    response.writeHead(404, {'Content-Tyoe': 'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
}

/**
 *
 * @param response
 * @param filePath The path of return content
 * @param fileContents content of the return
 */
function sendFile(response, filePath, fileContents) {
    response.writeHead(
        200,
        {"Content-type": mine.lookup(path.basename(filePath))}
    );
    response.end(fileContents);
}

/**
 * static file
 * @param response
 * @param cache
 * @param absPath
 */
function serverStatic(response, cache, absPath) {
    if(cache[absPath]){
        sendFile(response, absPath, cache[absPath]);
    }else{
        fs.exists(absPath, function(exists) {
            if(exists) {
                fs.readFile(absPath, function(err, data) {
                    if(err){
                        send404(response);
                    }else{
                        cache[absPath] = data;
                        sendFile(response, absPath, data);
                    }
                });
            }else{
                send404(response);
            }
        });
    }
}




