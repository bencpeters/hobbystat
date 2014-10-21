'use strict'; 

/* global require, console, module */

var express = require('express'),
    sockets = [],
    sensorAPI,
    router = express.Router();

var sensorData = [];

router.get("/sensors", function(req, res) {
  var sensorJson = { sensors: [] };
  for(var sensor in sensorAPI.sensors) if (sensorAPI.sensors.hasOwnProperty(sensor)) {
    sensorJson.sensors.push(sensorAPI.sensors[sensor].toJson());
  }
  res.json(sensorJson);
});

module.exports = router;

module.exports.addSocket = function(newSocket) {
  sockets.push(newSocket);
};

module.exports.removeSocket = function(socket) {
  var idx = sockets.indexOf(socket);
  if (idx > -1) { sockets.splice(idx, 1); }
};

module.exports.connectSensors = function(sensors) {
  sensorAPI = sensors;
};
