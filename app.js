'use strict';

var  log4js = require('log4js'),
     logger = log4js.getLogger();


var argv = process.argv.slice(2);

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
    , dispatcherPort =  GLOBAL.pjconfig.dispatcher.port
    , dispatcherAddress =   GLOBAL.pjconfig.dispatcher.address
    , acceptorPort =   GLOBAL.pjconfig.acceptor.port
    , acceptorAddress =   GLOBAL.pjconfig.acceptor.address;



acceptor.bindSync("tcp://" + acceptorAddress + ":" + acceptorPort);
dispatcher.bindSync("tcp://" + dispatcherAddress + ":" + dispatcherPort);


acceptor.on("message" , function (data){
    logger.debug(data.toString());
    dispatcher.send(data);
})

logger.info("start badjs-mq success. ");
