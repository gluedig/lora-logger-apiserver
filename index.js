const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const mongoose = require('mongoose')
const Promise = require('bluebird');
mongoose.Promise = Promise;

const restify = require('express-restify-mongoose')
const app = express()
var express_ws = require('express-ws')(app)
const router = express.Router()

app.use(bodyParser.json())
app.use(methodOverride())

var LoraSchema = require('lora-mongoose-schema')
mongoose.connect('mongodb://localhost/lora-test')
var LoraMessage = mongoose.model('LoraMessage', LoraSchema.Message)
var LoraGateway = mongoose.model('LoraGateway', LoraSchema.Gateway)
var LoraMessageLog = mongoose.model('LoraMessageLog', LoraSchema.MessageLog)


var default_options = {
    // api is read only
    preCreate: (req, res, next) => {
	res.sendStatus(401);
    },
    preUpdate: (req, res, next) => {
	res.sendStatus(401);
    },
    preDelete: (req, res, next) => {
	res.sendStatus(401);
    }
};


restify.serve(router, LoraMessage, default_options)
restify.serve(router, LoraGateway, default_options)

router.ws('/echo', (ws, req) => {
    ws.on('message', (msg) => {
	ws.send(msg);
    });
});

router.ws('/notify', (ws, req) => {
});

var aWss = express_ws.getWss('/notify');

var stream = LoraMessageLog.find().tailable().cursor()
stream.on('data', function(doc) {
//  console.log('log stream data - new doc:', doc.message);
  aWss.clients.forEach(function (client) {
    client.send(JSON.stringify(doc.message));
  });
}).on('error', function (error) {
  console.log('status stream data - error:', error.message);
}).on('close', function () {
  console.log('status stream data - closed');
});


app.use(router)
app.listen(3000, () => {
    console.log('Express server listening on port 3000')
});
