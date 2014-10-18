'use strict';

// Declare app level module which depends on views, and components
angular.module('ardusatData', [
  'ngRoute',
  'ui.bootstrap',
  'btford.socket-io',
  'ardusatData.sensorData',
  'ardusatData.d3'
]).

factory('socket', ['socketFactory', function(socketFactory) {
  var sf = socketFactory();
  return sf;
}]).

config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/sensors'});
}]);
