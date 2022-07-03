const express = require('express');
const app = express();
const path = require('path');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json()
const router = express.Router();
app.use(express.static(__dirname + '/public'));
var clients = {};


const {run,icu,enroll,set_options} = require('icu-connect')
run({
  'ip':'192.168.137.8',
  'ssl':true,
  'port':44345,
  'username':'apiuser',
  'password':'apipassword'
});

icu.on('connected',function(data){
  console.log('device',data)
});
icu.on('device_state',function(data){
  console.log('state',data)
})

icu.on('sessionstart',function(){
  console.log('sessionstart')    
  Object.keys(clients).forEach(key => {
    var cmd = {
      'cmd':'start_session'
    }
    clients[key].send(JSON.stringify(cmd))
  });
});
icu.on('sessionend',function(){
  console.log('sessionend')  
  Object.keys(clients).forEach(key => {
    var cmd = {
      'cmd':'end_session'
    }
    clients[key].send(JSON.stringify(cmd))
  });
}); 
icu.on('age',function(data){
  console.log('age')
  Object.keys(clients).forEach(key => {
    var cmd = {
      'cmd':'no_id',
      'data':data
    }
    clients[key].send(JSON.stringify(cmd))
  });
});

icu.on('uid',function(data){
  console.log('uid')
  Object.keys(clients).forEach(key => {
    var cmd = {
      'cmd':'id',
      'data':data
    }
    clients[key].send(JSON.stringify(cmd))
  });
});


const webSocketServer = require('websocket').server;
const http = require('http');
var server = http.createServer(function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});
server.listen(8080, function() {
  console.log((new Date()) + ' Server is listening on port 8080');
});

const wsServer = new webSocketServer({
	httpServer: server,
    autoAcceptConnections: false
});


function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}
// Generates unique userid for every user.
const generateUniqueID = () => {

	const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

	return s4() + '-' + s4() + '-' + s4();
};  
wsServer.on('request', function (request) {

  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }
  var userID = generateUniqueID();

  console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');

  // You can rewrite this part of the code to accept only the requests from allowed origin
  const connection = request.accept(null, request.origin);

  clients[userID] = connection;
  console.log('connected: ' + userID, Object.keys(clients).length)

  connection.on('message', function (message) {
    console.log('msg', message)
    if (message.type === 'utf8') {

      // const clientRequest = JSON.parse(message.utf8Data)
      // if(clientRequest.cmd == 'enroll'){
      //     enrollData.push(clientRequest.data)
      // }
      // console.log('send')
      // var msg = 'hello'
      // connection.send(msg)

    }
    else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
    }
  });

  connection.on('close', function (reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.', userID);
    delete clients[userID];
  });


  connection.on('open', function (reasonCode, description) {
      console.log('open')
  });  







});





router.get('/',jsonParser,function(req,res){
  res.sendFile(path.join(__dirname+'/index.html'));
});

router.post('/',jsonParser,function(req,res){

  enroll(req.body)
  res.sendStatus(200);

});


//add the router
app.use('/', router);
app.listen(process.env.port || 3000);

console.log('Running at Port 3000');