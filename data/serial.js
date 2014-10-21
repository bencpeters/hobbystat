'use strict';

/* global require, console, process */

var com = require("serialport"),
    serialPort,
    config;

var setup = function(newConfig, api) {
  var port;
  config = newConfig;

  if (config.data && config.data.serialPort) {
    port = config.data.serialPort;
  } else {
    port = "/dev/cu.usbmodem1411";
  }

  serialPort = new com.SerialPort(port, {
    baudrate: 9600,
    parser: com.parsers.readline('~')
  }, false);

  serialPort.open(function(err) {
    if (err) { 
      console.error("Connection to Arduino failed: " + err);
      if (process.env.GENERATE_DATA) {
        console.log("Generating synthetic data...");
        setInterval(function () {
          var sensors = [
            { sensorName:'accelerometerX', unit:"m/s^2" },
            { sensorName:'accelerometerY', unit:"m/s^2" },
            { sensorName:'accelerometerZ', unit:"m/s^2" },
            { sensorName:'gyroX', unit:"m/s^2" },
            { sensorName:'gyroY', unit:"m/s^2" },
            { sensorName:'gyroZ', unit:"m/s^2" },
            { sensorName:'temp', unit:"F" }
          ];
          var data = sensors[Math.floor(Math.random() * sensors.length)];
          data.value = Math.random() * 100;
          api.addSensorData(data);
        }, 100);
      }
      return;
    }
    console.log('Serial port connection with Arduino opened.');

    serialPort.on('data', function(data) {
      var parsedData;
      try {
        parsedData = JSON.parse(data.split("|")[0]);
        api.addSensorData(parsedData);
      } catch (err) { }
    });
  });
};

module.exports = setup;
