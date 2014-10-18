'use strict';
/*global angular, window */ 

var d3PlotController = function() {
  return function($scope) {
    var config = {},
        _this = this,
        hooks = { preSetup: function () {},
                  postSetup: function() {},
                  preUpdate: function() {},
                  preRedrawData: function() {},
                  redrawData: function(config, data) { _this.redrawData(config, data); },
                  postUpdate: function () {}
    };

    this.config = function() { return config; };
    this.hooks = function() { return hooks; };
    this.$scope = function() { return $scope; };
    this.svg = function() { return $scope.svg; };

    this.addHooks = function(newHooks) {
      angular.extend(hooks, newHooks);
    };

    this.setMargin = function(newMargin) {
      var attrs = ['top', 'bottom', 'left', 'right'];
      $scope.margin = $scope.margin || {};
      if (isNaN(newMargin)) {
        for (var i=0; i < attrs.length; i++) {
          if (newMargin.hasOwnProperty(attrs[i])) { 
            $scope.margin[attrs[i]] =  newMargin[attrs[i]];
          }
        }
      } else {
        $scope.margin = { top: +newMargin, right: +newMargin, bottom: +newMargin, left: +newMargin };
      }
    };

    this.genericSetup = function(data) {
      config = {};

      // clean up any existing SVG elements
      $scope.svg.selectAll('*').remove();

      if (!data) { return; }

      var d3 = config.d3 = $scope.d3;
      config.svg = $scope.svg;
      config.pWidth = $scope.width - $scope.margin.right - $scope.margin.left;
      config.pHeight = $scope.height - $scope.margin.top - $scope.margin.bottom;
      config.legendInfo = [];

      hooks.preSetup(config, data);

      config.view = $scope.svg.append("g")
        .attr("transform", "translate(" + $scope.margin.left + "," + $scope.margin.right + ")");

          
      if (data.xType === 'datetime') {
        config.x = config.d3.time.scale()
          .range([0, config.pWidth]);
        if (data.timeFormat != 'date') {
          if (data.timeFormat) {
            config.parseDate = config.d3.time.format(data.timeFormat).parse;
          } else {
            config.parseDate = config.d3.time.format("%Y-%m-%d").parse;
          }
        } else {
          config.parseDate = function(date) { return date; };
        }
      } else {
        config.x = d3.scale.linear()
          .range([0, config.pWidth]);
      }

      config.y = d3.scale.linear()
        .range([config.pHeight, 0]);

      config.xAxis = d3.svg.axis()
        .orient("bottom");

      config.yAxis = d3.svg.axis()
        .orient("left");

      config.dataSeries = [];
      for (var i=0; i < data.series.length; i++) {
        if (config.legendInfo.length <= i) {
          config.legendInfo.push({label: data.series[i].label || "Series " + i,
                                  color: data.series[i].color});
        }
      }
      
      if (data.series.length > 1) {
        config.legend = config.svg.selectAll(".legend")
          .data(config.legendInfo)
          .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(-20," + (i * 20 + 50) + ")"; });

        config.legend.append("rect")
          .attr("x", config.pWidth - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", function(d) { return d.color; });

        config.legend.append("text")
          .attr("x", config.pWidth - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) { return d.label; });
      }

      config.xAxisElement = config.view.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + config.pHeight + ")");

      if (data.xLabel) {
        config.xLabel = config.xAxisElement.append("text")
          .attr("class", "label")
          .attr("x", config.pWidth / 2)
          .attr("y", 35)
          .style("text-anchor", "middle")
          .text(data.xLabel);
      }

      config.yAxisElement = config.view.append("g")
        .attr("class", "y axis");

      if (data.yLabel) {
        config.yLabel = config.yAxisElement.append("text")
          .attr("class", "label")
          .attr("x", 0 - config.pHeight / 2)
          .attr("y", -45)
          .style("text-anchor", "middle")
          .attr("transform", "rotate(-90)")
          .attr("dy", "1em")
          .text(data.yLabel);
      }

      if (data.title) {
        config.title = config.view.append("text")
          .attr("x", config.pWidth / 2)
          .attr("y", 0 + ($scope.margin.top))
          .style("text-anchor", "middle")
          .style("font-size", "16px")
          .text(data.title);
      }
    };

    this.updateData = function(data) {
      if (!data) { return; }
      if (!config.d3) { return _this.setup(data); }
      var ts = [],
          yMax,
          yMin,
          d3 = config.d3;

      hooks.preUpdate(config, data);
      if (data.xType === 'datetime') {
        data.series.map(function(s) { 
          var e = d3.extent(s.data, function(d) { return config.parseDate(d.x); });
          for (var i=0; i < e.length; i++) {
            ts.push(e[i]); 
          }
        });
        config.x.domain(config.d3.extent(ts));
      } else {
        config.x.domain([d3.min(data.series.map(function(d){ return d3.min(d.data, function(e) { return e.x; }); })),
                         d3.max(data.series.map(function(d){ return d3.max(d.data, function(e) { return e.x; }); }))]);
      }

      yMin = d3.min(data.series.map(function(d){ return d3.min(d.data, function(e) { return e.y; }); }));
      if (yMin >= 0) { yMin = 0; }
      else { yMin = yMin - Math.abs(yMin * (1/5)); }
      yMax = d3.max(data.series.map(function(d){ return d3.max(d.data, function(e) { return e.y; }); }));
      yMax = yMax + Math.abs(yMax * (1/5));

      config.y.domain([yMin, yMax]);

      hooks.preRedrawData(config, data);
      hooks.redrawData(config, data);

      config.xAxis.scale(config.x);
      config.xAxisElement.call(config.xAxis);

      config.yAxis.scale(config.y);
      config.yAxisElement.call(config.yAxis);

      hooks.postUpdate(config, data);
    };
  };
};

var d3PlotInitialize = function($window, d3Service) {
  return function(scope, element, attrs, ctrl) {
    d3Service.d3().then(function(d3) {
      scope.d3 = d3;
      scope.margin = scope.margin || {};

      var updateDims = function() {
        scope.margin.top = scope.margin.top || 20;
        scope.margin.right = scope.margin.right || 20;
        scope.margin.bottom = scope.margin.bottom || 40;
        scope.margin.left = scope.margin.left || 50;
        scope.width = element[0].parentNode.offsetWidth;
        scope.height = element[0].parentNode.offsetHeight;
      };
      updateDims();

      scope.svg = scope.d3.select(element[0])
        .append("svg")
        .attr('width', '100%')
        .attr('height', '100%');
        /*
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('preserveAspectRatio', 'xMinYMin');
        */

      // Handle browser resizing
      window.onresize = function() {
        updateDims();
        ctrl.setup(scope.data);
      };

      scope.$watch(function() {
        return element[0].parentNode.offsetWidth;
      }, function() {
        updateDims();
        ctrl.setup(scope.data);
      });

      scope.$watch(function() {
        return element[0].parentNode.offsetHeight;
      }, function() {
        updateDims();
        ctrl.setup(scope.data);
      });

      scope.$watch('data', function(newData, oldData) {
        ctrl.updateData(newData);
      }, true);
    });
  };
};

angular.module('ardusatData.d3', []).

factory('d3Service', ['$document', '$q', '$rootScope',
  function($document, $q, $rootScope) {

    var promises = [];

    var loadScriptTag = function(tagName, retValFxn) {
      var d = $q.defer(),
          s = $document[0].getElementsByTagName('body')[0],
          scriptTag = $document[0].createElement('script');

      function onScriptLoad() {
        // Load client in the browser
        $rootScope.$apply(function() { d.resolve(retValFxn()); });
      }

      // Create script tag 
      scriptTag.type = 'text/javascript';
      scriptTag.async = true;
      scriptTag.src = tagName;
      scriptTag.onreadystatechange = function() {
        if (this.readyState === 'complete') { onScriptLoad(); }
      };
      scriptTag.onload = onScriptLoad;

      s.appendChild(scriptTag);

      return d.promise;
    };

    return {
      d3: function() { return loadScriptTag('d3/d3-src.js', function() { return window.d3; }); },
      crossfilter: function() { return loadScriptTag('d3/crossfilter.min.js'); },
      gauge: function() { return loadScriptTag('d3/gauge.js', function() { return Gauge; }); }
    };
}]).

directive('d3Line', ['$window', 'd3Service', function($window, d3Service) {
  var controller = d3PlotController();
  controller.prototype.setup = function(data) {
    this.genericSetup(data);

    var $scope = this.$scope(),
        config = this.config(),
        hooks = this.hooks(),
        d3;

    if (!config.d3) { return; }
    d3 = config.d3;

    config.line = d3.svg.line()
      .x(function(d, i) { return config.x(d.x); })
      .y(function(d) { return config.y(d.y); })
      .interpolate("cardinal");

    if (data.xType === 'datetime') {
      config.line.x(function(d) { return config.x(config.parseDate(d.x)); });
    }

    for (var i=0; i < data.series.length; i++) {
      var color = config.legendInfo[i].color;

      config.dataSeries.push(config.view.append("path")
        .style("stroke", color)
        .attr("stroke-width", 2)
        .attr("fill", "none"));
    }

    hooks.postSetup(config, data);
    this.updateData(data);
  };

  controller.prototype.redrawData = function(config, data) {
    for (var i=0; i < data.series.length; i++) {
      config.dataSeries[i]
        .datum(data.series[i].data)
      .transition()
        .duration(250)
        .attr("d", config.line);
    }
  };

  return {
    restrict: 'EA',
    scope: {
      data: '='
    },
    controller: ['$scope', controller],
    link: d3PlotInitialize($window, d3Service)
  };
}]).

directive('d3Area', ['$window', 'd3Service', function($window, d3Service) {
  var controller = d3PlotController();
  controller.prototype.setup = function(data) {
    this.genericSetup(data);

    var $scope = this.$scope(),
        config = this.config(),
        hooks = this.hooks(),
        d3;

    if (!config.d3) { return; }
    d3 = config.d3;

    config.area = d3.svg.area()
      .x(function(d, i) { return config.x(d.x); })
      .y0(function(d) { return config.y(0); })
      .y1(function(d) { return config.y(d.y); })
      .interpolate("cardinal");

    config.line = d3.svg.line()
      .x(function(d, i) { return config.x(d.x); })
      .y(function(d) { return config.y(d.y); })
      .interpolate("cardinal");

    if (data.xType === 'datetime') {
      config.area.x(function(d) { return config.x(config.parseDate(d.x)); });
      config.line.x(function(d) { return config.x(config.parseDate(d.x)); });
    }

    for (var i=0; i < data.series.length; i++) {
      var color = config.legendInfo[i].color;

      config.dataSeries.push({area: config.view.append("path")
          .style("fill", color)
          .attr("class", "area"),
        line: config.view.append("path")
          .style("stroke", color)
          .attr("stroke-width", 2)
          .attr("fill", "none")});
    }

    hooks.postSetup(config, data);
    this.updateData(data);
  };

  controller.prototype.redrawData = function(config, data) {
    for (var i=0; i < data.series.length; i++) {
      config.dataSeries[i].area
        .datum(data.series[i].data)
      .transition()
        .duration(250)
        .attr("d", config.area);
      config.dataSeries[i].line
        .datum(data.series[i].data)
      .transition()
        .duration(250)
        .attr("d", config.line);
    }
  };

  return {
    restrict: 'EA',
    scope: {
      data: '='
    },
    controller: ['$scope', controller],
    link: d3PlotInitialize($window, d3Service)
  };
}])

.directive('d3Gauge', ['$window', '$q', 'd3Service', function($window, $q, d3Service) {
  return {
    restrict: 'EA',
    scope: {
      min: '=',
      max: '=',
      value: '='
    },
    controller: ['$scope', function($scope) {
      var config = {},
          _this = this,
          hooks = { preSetup: function () {},
                    postSetup: function() {},
                    preUpdate: function() {},
                    preRedrawData: function() {},
                    redrawData: function(config, data) { config.gauge.redraw(data); },
                    postUpdate: function () {}
      };

      this.addHooks = function(newHooks) {
        angular.extend(hooks, newHooks);
      };

      this.setup = function(data) {
        config = {};

        $scope.element.children().remove();
        if (!data) { return; }

        var d3 = config.d3 = $scope.d3;
        var Gauge = config.Gauge = $scope.Gauge;
        config.gaugeConfig = $scope.gaugeConfig;
        var range = config.gaugeConfig.max - config.gaugeConfig.min;
        config.gaugeConfig.yellowZones = [{ from: config.gaugeConfig.min + range*0.75, 
                                            to: config.gaugeConfig.min + range*0.9 }];
        config.gaugeConfig.redZones = [{ from: config.gaugeConfig.min + range*0.9, 
                                         to: config.gaugeConfig.max }];
        hooks.preSetup(config, data);

        var gauge = config.gauge = new Gauge("gauge", config.gaugeConfig);
        gauge.render(d3.select($scope.element[0]));

        hooks.postSetup(config, data);
        this.updateData(data);
      };

      this.updateData = function(data) {
        var redraw = false;

        if (!data) { return; }
        if (!config.d3) { return _this.setup(data); }

        hooks.preUpdate(config, data);

        if (data > config.gaugeConfig.max) {
          redraw = true;
          $scope.gaugeConfig.max = Math.ceil(data);
        } 
        if (data < config.gaugeConfig.min) {
          redraw = true;
          $scope.gaugeConfig.min = Math.floor(data);
        } 

        if (redraw) { return _this.setup(data); }

        hooks.preRedrawData(config, data);
        hooks.redrawData(config, data); 
        hooks.postUpdate(config, data);
      };
    }],
    link: function(scope, elem, attrs, ctrl) {
      $q.all([d3Service.d3(), d3Service.gauge()]).then(function(resources) {
        var d3 = resources[0],
            gauge = resources[1];

        scope.d3 = d3;
        scope.Gauge = gauge;
        scope.element = elem;

        var getSize = function() {
          return parseInt(attrs.size) || d3.min([elem[0].parentNode.offsetWidth, elem[0].parentNode.offsetHeight]);
        };
        scope.gaugeConfig = {
          size: getSize(),
          min: parseInt(attrs.min) || 0,
          max: parseInt(attrs.max) || 100,
          majorTicks: parseInt(attrs.majorTicks) || 5,
          minorTicks: parseInt(attrs.minorTicks) || 2,
          label: attrs.name || attrs.id || ""
        };

        //browser resizing
        window.onresize = function() {
          scope.gaugeConfig.size = getSize();
          ctrl.setup(scope.value);
        };

        scope.$watch('value', function(newValue, oldValue) {
          ctrl.updateData(newValue);
        }, true);
      });
    }
  };
}]);
