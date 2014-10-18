'use strict'; 

/* global require, console */

var express = require('express'),
    sockets = [],
    router = express.Router();

var sensorData = [];

router.get("/data", function(req, res) {
  var dataToSend = sensorData;
  sensorData = [];
  res.json(dataToSend);
});

module.exports = router;

module.exports.addSensorData = function(newData) {
  newData.timeStamp = Date.now();

  for (var i=0; i < sockets.length; i++) {
    sockets[i].emit('data', newData);
  }

  sensorData.push(newData);
  if (sensorData.length > 10000) {
    sensorData.splice(0, 5000);
  }
};

module.exports.addSocket = function(newSocket) {
  sockets.push(newSocket);
};

module.exports.removeSocket = function(socket) {
  var idx = sockets.indexOf(socket);
  if (idx > -1) { sockets.splice(idx, 1); }
};
