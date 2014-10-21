'use strict';

/* global require, console, module, clearInterval, setInterval */

var sensors = {},
    db;

function Sensor(name, params) {
  var _this = this,
      updateRef,
      logFreq,
      vals = {};

  var parseTime = function(timeString) {
    if (!timeString) { return; }
    var time = timeString.match(/(\d+)([a-z]*)/i);
    if (!time) { return; }
    var num = parseInt(time[0], 10);

    switch(time[1].toLowerCase()) {
      case 's':
        //roll
      case 'sec':
        num = num * 1000;
        break;
      case 'm':
        //roll
      case 'min':
        num = num * 1000 * 60;
        break;
      case 'h':
        //roll
      case 'hour':
        //roll
      case 'hours':
        num = num * 1000 * 60 * 60;
        break;
      case 'd':
        //roll
      case 'day':
        //roll
      case 'days':
        num = num * 1000 * 60 * 60 * 24;
        break;
    }

    return num;
  };
  
  this.name = name;
  this.type = params.type || "Unknown";
  this.valueTypes = params.valueTypes || [];

  this.setLogFreq = function(newFreq) {
    if (!newFreq) { return;}
    if (updateRef) { clearInterval(updateRef); }
    logFreq = newFreq;
    updateRef = setInterval(_this.logSensors, newFreq);
  };

  this.logFreq = function() { return logFreq; };

  this.updateValue = function(valName, newVal, params) {
    if (!vals[valName]) {
      vals[valName] = {
        value: null,
        type: null,
        updated: null,
        unit: null
      };
    }

    vals[valName].value = newVal;
    vals[valName].updated = params.timeStamp || Date.now();
    vals[valName].type = params.type || vals[valName].type;
    vals[valName].unit = params.unit || vals[valName].unit;
  };

  this.getValue = function(valName, defaultValue) {
    if (!vals[valName] && typeof(defaultValue) !== 'undefined') {
      return defaultValue;
    } else {
      return vals[valName];
    }
  };
  
  this.toJson = function() {
    var currentValues = [];
    for (var valName in vals) {
      currentValues.push(vals[valName]);
    }
    return {
      name: _this.name,
      type: _this.type,
      valueTypes: _this.valueTypes,
      currentValues: currentValues
    };
  };

  this.logSensors = function() {
    if (!db) { return; }
    db.collection('raw_data', function(err, col) {
      if (err) { 
        console.error("Error retrieving collection to log sensor " + _this.name + " to db: " + err);
        return;
      }
      var records = [],
          ts = new Date;
      for (var valName in vals) {
        records.push({sensor: _this.name, 
                      valueType: vals[valName].type,
                      ts: ts, 
                      value: vals[valName].value}); 
      }
        
      col.insert(records, function(err, res) {
        if (err) {
          console.error("Error inserting records for sensor " + _this.name + ": " + err);
        }
      });
   });
  };

  this.setLogFreq(parseTime(params.logFreq) || 60000);
}

module.exports.Sensor = Sensor;
module.exports.sensors = [];
module.exports.connectDb = function(newDb) { db = newDb; };
