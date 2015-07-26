'use strict';

var  log4js = require('log4js'),
     logger = log4js.getLogger();




if(argv.indexOf('--debug') >= 0){
    logger.setLevel('DEBUG');
}else {
    logger.setLevel('INFO');
}


if(argv.indexOf('--project') >= 0){
    GLOBAL.pjconfig =  require('./project.debug.json')
}else {
    GLOBAL.pjconfig =  require('./project.json');
}


var zmq = require('zmq')
    , dispatcher = zmq.socket('pub')
    , acceptor = zmq.socket('pull')
    , dispatcherPort =  "8071"
    , dispatcherAddress =  "127.0.0.1"
    , acceptorPort =  "8072"
    , acceptorAddress =  "127.0.0.1";



acceptor.bindSync("tcp://" + acceptorAddress + ":" + acceptorPort);
dispatcher.bindSync("tcp://" + dispatcherAddress + ":" + dispatcherPort);


acceptor.("message" , function (data){
    logger.debug(data.toString());
    dispatcher.send(data);
})
