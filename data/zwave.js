'use strict';

/* global require, console, module */

var OpenZWave = require('openzwave'),
    zWave,
    data,
    homeId,
    nodes = {},
    config;

var setup = function(newConfig, dataModel) {
  config = newConfig;
  data = dataModel;

  if (config.sources && config.sources.zWave) {
    zWave = new OpenZWave(config.sources.zWave, {
      logging: true,
      saveconfig: true,
      validatevalues: false,
    });
    zWave.on('connected', function() {
      console.log("Connected to Z Wave network");
    });

    zWave.on('driver ready', function(netId) {
      homeId = netId;
      console.log("Scanning network " + netId);
    });

    zWave.on('driver failed', function() {
      console.log("ERROR: Z-Wave driver failed to initialize");
      zWave.disconnect();
    });

    zWave.on('node added', function(nodeId) {
      nodes[nodeId] = { id: nodeId, name: '', type: '', comClasses: { } };
      console.log('Discovered new node ' + nodeId);
    });

    zWave.on('value added', function(nodeId, commandClass, value) {
      console.log("New value " + JSON.stringify(value) + " discovered. (nodeId: " + nodeId +
                  ", commandClass: " + commandClass + ")");
      if (!nodes[nodeId].comClasses[commandClass]) { nodes[nodeId].comClasses[commandClass] = {}; }
      nodes[nodeId].comClasses[commandClass][value.index] = value;
    });

    zWave.on('value changed', function(nodeId, commandClass, value) {
      console.log("Value changed: " + JSON.stringify(value) + " (nodeId: " + nodeId +
                  ", commandClass: " + commandClass + ")");
      if (!nodes[nodeId].comClasses[commandClass]) { nodes[nodeId].comClasses[commandClass] = {}; }
      nodes[nodeId].comClasses[commandClass][value.index] = value;

      if (nodes[nodeId].updateFxn) { nodes[nodeId].updateFxn(commandClass, value); }
    });

    zWave.on('node ready', function(nodeId, nodeInfo) {
      var sensor;

      nodes[nodeId].manufacturer = nodeInfo.manufacturer;
      nodes[nodeId].manufacturerid = nodeInfo.manufacturerid;
      nodes[nodeId].product = nodeInfo.product;
      nodes[nodeId].producttype = nodeInfo.producttype;
      nodes[nodeId].productid = nodeInfo.productid;
      nodes[nodeId].type = nodeInfo.type;
      nodes[nodeId].name = nodeInfo.name;
      nodes[nodeId].loc = nodeInfo.loc;
      console.log('Node ' + nodeId + ' is ready. Info: ' + JSON.stringify(nodes[nodeId]));

      // Config options
      if (nodes[nodeId].product == 'Multi Sensor') {
        console.log('Configuring Multi Sensor node ' + nodeId + '...');
        zWave.setConfigParam(homeId, nodeId, 101, 224);
        zWave.setConfigParam(homeId, nodeId, 111, 60);
        if (nodes[nodeId].name.length === 0) {
          zWave.setName("ZWave_" + nodeId);
          nodes[nodeId].name = "ZWave_" + nodeId;
        }

        sensor = new data.Sensor(nodes[nodeId].name, { 
          type: "Aeotec MultiSensor",
          valueTypes: [ 'temp', 'humidity', 'light', 'motion' ]
        });

        data.sensors[nodes[nodeId].name] = sensor;

        nodes[nodeId].updateFxn = function(cmdClass, val) {
          var valName, labels = {
            Temperature: 'temp',
            Luminance: 'light',
            "Relative Humidity": 'humidity'
          };

          if (cmdClass == 0x30) {
            valName = 'motion';
          } else if (cmdClass == 0x31) {
            valName = labels[val.label];
          }
          if (valName) {
            sensor.updateValue(valName, val.value, { type: valName, unit: val.unit });
          }
        };

        nodes[nodeId].updateFxn(0x30, nodes[nodeId].comClasses[0x30][0]);
        for (var idx in nodes[nodeId].comClasses[0x31]) {
          nodes[nodeId].updateFxn(0x31, nodes[nodeId].comClasses[0x31][idx]);
        }
      }
    });

    zWave.on('scan complete', function() {
      console.log('Completed scan of zwave network');
    });

    zWave.on('notification', function(nodeId, notification) {
      console.log('Received notification from ' + nodeId + ": " + JSON.stringify(notification));
    });

    console.log('Connecting to zwave on ' + config.sources.zWave);
    zWave.connect();
  }

};

module.exports = setup;
