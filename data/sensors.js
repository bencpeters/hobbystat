'use strict';

/* global require, console, module */

var sensors = {};

function Sensor(name, params) {
  var _this = this,
      vals = {};
  
  this.name = name;
  this.type = params.type || "Unknown";
  this.valueTypes = params.valueTypes || [];

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
}

module.exports.Sensor = Sensor;
module.exports.sensors = [];
