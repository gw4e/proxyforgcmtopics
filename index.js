'use strict';



const http = require("http");
const https = require("https");
const moment = require('moment');
// CORS Express middleware to enable CORS Requests.
const cors = require('cors')({
  origin: true,
});

var express = require('express')
var app = express()
var bodyParser = require('body-parser');



var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;

app.set('port', port)
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

 
function unregisteTopics(data) {
  console.log("XXXXXXXXXXXX ")
  console.log(data)
  var options = {
    hostname: 'iid.googleapis.com',
    port: 443,
    path: "/iid/info/" + data.t + "?details=true",
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'key=AAAAOvFXwrI:APA91bGWDp8GEp5r6Zx9lFx4_O5EULRsge79tgf2D6SsH2kXSREQInwTewUzQj-jWtIrXazuBmZhHqO4eXQJ6CQKXKszLENJwHJiUIQaWwh-WAcjffjG2qEElSocOsOrI26gVB0j71uT'
    }
  };
  var req = https.request(options, function (res) {
    console.log('Status: ' + res.statusCode);
    console.log('Headers: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    let body = "";
    res.on('data', function (dt) {
      console.log('Body: ');
      console.log(dt);
      body += dt;
    });
    res.on("end", () => {
      let jsbody = JSON.parse(body);
      console.log("jsbody")
      console.log(jsbody)
      let topictoremove = [];
      if (jsbody.rel) {
        if (jsbody.rel.topics) {
          var topics = jsbody.rel.topics;
          var keys = Object.keys(topics);
          keys.forEach ((topic) => {
            if (topic.startsWith(data.z)) {
              _doIt(topic, data.t,'iid.googleapis.com', 443, '/iid/v1:batchRemove');
            }
          });
        }
      }
    });
  });
  req.on('error', function (e) {
    console.log('problem with request: ');
    console.log(e);
  });
  req.write(JSON.stringify(data));
  req.end();
}

function unregisterFromTopic(data) {
  if (data.type == 0) {
    doIt(data, 'iid.googleapis.com', 443, '/iid/v1:batchRemove');
  } else {
    unregisteTopics(data)
  }
  
}

function registerToTopic(data) {
  doIt(data, 'iid.googleapis.com', 443, '/iid/v1:batchAdd');
}

function doIt(data, hostname, port, path) {
  _doIt(data.z + "-" + data.c, data.t, hostname, port, path)
}

function _doIt(topic, token, hostname, port, path) {
  var registration = {
    "to": "/topics/" + topic,
    "registration_tokens": [token],
  }
  
  var options = {
    hostname: hostname,
    port: port,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'key=AAAAOvFXwrI:APA91bGWDp8GEp5r6Zx9lFx4_O5EULRsge79tgf2D6SsH2kXSREQInwTewUzQj-jWtIrXazuBmZhHqO4eXQJ6CQKXKszLENJwHJiUIQaWwh-WAcjffjG2qEElSocOsOrI26gVB0j71uT'
    }
  };
  var req = https.request(options, function (res) {
    // console.log('Status: ' + res.statusCode);
    // console.log('Headers: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (body) {
       console.log('ok for : ' + registration.to);
    });
  });

  req.on('error', function (e) {
    console.log('problem with request for : ' + token);
    console.log(e);
  });

  req.write(JSON.stringify(registration));
  console.log("XXXXXXXXXX")
  console.log(options)
  console.log(registration)
  req.end();
}


function send(data) {
  if (data.type <= 0) {
    unregisterFromTopic(data)
  } else {
    registerToTopic(data)
  }
}

app.get('/', function (request, response) {
  response.send('Ready to manage subscription')
})

 
app.post('/push', function (req, res) {
  if (req.method === 'PUT') {
    res.status(403).send('Forbidden!');
  }
  
  cors(req, res, () => {
    
    //console.log("req");
    //console.log(req);
 
    let actions = req.query.data;
    
    if (!actions) {
      actions = req.body.data;
    }
    
    // console.log("actions");
    // console.log(actions);
    var print = true
     
    actions.forEach(data => {
        if (print) {
          console.log('Starting registrations for : ' + data.t);
          print = false;
        }
        send(data);
    });
    console.log('With ' + actions.length + ' registrations.');
    res.status(200).send("ok");
     
  });
})

app.listen(app.get('port'), function () {
  console.log("Ready to receive topics subscriptions requests :" + app.get('port'))
})



