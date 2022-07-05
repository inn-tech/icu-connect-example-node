const express = require('express');
const app = express();
const path = require('path');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json()
const router = express.Router();
app.use(express.static(__dirname + '/public'));
var clients = {};

var sys_state = {
  'icu':'disconnected',
  'session':false
}


const {run,icu,enroll,set_options} = require('icu-connect')
run({
  'ip':'192.168.137.8',
  'ssl':true,
  'port':44345,
  'username':'apiuser',
  'password':'apipassword',
  'db_dir':__dirname,
  'db_name':'icu.db'
});

icu.on('connected',function(data){
  console.log('device',data)
  Object.keys(clients).forEach(key => {
    var cmd = {
      'cmd':'connected'
    }
    clients[key].send(JSON.stringify(cmd))    
  });  
  sys_state.icu = 'connected'    
});

icu.on('disconnected',function(){
  console.log('device disconnected')
  Object.keys(clients).forEach(key => {
    var cmd = {
      'cmd':'disconnected'
    }
    clients[key].send(JSON.stringify(cmd)) 
  });  
  sys_state.icu = 'disconnected'     
})

icu.on('device_state',function(data){
  console.log('state',data)
  Object.keys(clients).forEach(key => {
    var cmd = {
      'cmd':'state',
      'data':data.device_state
    }
    clients[key].send(JSON.stringify(cmd))
  });    
  sys_state.icu = data.device_state   
})

icu.on('sessionstart',function(){
  console.log('sessionstart')    
  Object.keys(clients).forEach(key => {
    var cmd = {
      'cmd':'start_session'
    }
    clients[key].send(JSON.stringify(cmd))   
  });
  sys_state.session = true   
});
icu.on('sessionend',function(){
  console.log('sessionend')  
  Object.keys(clients).forEach(key => {
    var cmd = {
      'cmd':'end_session'
    }
    clients[key].send(JSON.stringify(cmd))  
  });
  sys_state.session = false    
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


icu.on('face_saved',function(data){
  console.log('face_saved',data.uid)

  Object.keys(clients).forEach(key => {
    var cmd = {
      'cmd':'enrolled',
      'data':data
    }
    clients[key].send(JSON.stringify(cmd))
  });

  /*
    Here you can access the saved adata fro an external database
   */
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

  // send a state update to new client on connection
  var msg = {
    'cmd':'init',
    'data':sys_state
  }
  connection.send(JSON.stringify(msg))  

  connection.on('message', function (message) {
    console.log('msg', message)
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
app.listen(process.env.port || 3030);

console.log('Running at Port 3030');