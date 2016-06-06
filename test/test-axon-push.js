/**
 * Created by chriscai on 2016/6/6.
 */

var mq = require('axon')
    , client = mq.socket('push')
    , port =  10001
    , address = "127.0.0.1"
    , service = "badjs";

var log4js = require('log4js'),
    logger = log4js.getLogger();


client.connect("tcp://" + address + ":" + port);

client.send("badjs991|adfasdfasdf" );
