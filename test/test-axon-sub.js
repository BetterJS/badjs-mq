/**
 * Created by chriscai on 2016/6/6.
 */

var  zmq = require('axon')
    , client = zmq.socket('sub')

client.connect("tcp://127.0.0.1:10000");
client.subscribe("badjs*");

client.on("message" , function (data){
        console.log(data.toString());
})