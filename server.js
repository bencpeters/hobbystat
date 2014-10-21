'use strict';

/* global require, console, process, __dirname */

var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    debug = require('debug')('hobbystat'),
    cookieParser = require('cookie-parser'),
    config = require('./config.json'),
    MongoClient = require('mongodb').MongoClient,
    MongoServer = require('mongodb').Server,
    bodyParser = require('body-parser');

var staticRoutes = require('./routes/static'),
    api = require('./routes/api'),
    users = require('./routes/users');

var sensors = require('./data/sensors'),
    zWave = require('./data/zwave')(config, sensors);

var mongoHost = config.db && config.db.mongo && config.db.mongo.host ? config.db.mongo.host : 'localhost',
    mongoPort = config.db && config.db.mongo && config.db.mongo.port ? config.db.mongo.port : 27017,
    dbName = config.db && config.db.mongo && config.db.mongo.dbName ? config.db.mongo.dbName : "sensorData",
    mongoClient = new MongoClient(new MongoServer(mongoHost, mongoPort));

mongoClient.open(function(err, mongoClient) {
  var db = mongoClient.db(dbName);
  sensors.connectDb(db);
});

api.connectSensors(sensors);

var app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server);

app.set('port', process.env.PORT || 3000);
server.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'app')));

app.use('/', staticRoutes);
app.use('/api', api);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
