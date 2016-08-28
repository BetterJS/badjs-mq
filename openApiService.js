var net = require('net');
var _ = require("underscore");
var crypto = require('crypto');

var fs = require('fs');
var connect = require('connect'),
    log4js = require('log4js'),
    logger = log4js.getLogger();

var path = require("path");


var argv = process.argv.slice();
if(argv.indexOf('--debug') >= 0){
    logger.setLevel('DEBUG');
    logger.info('running in debug');

}else {
    logger.setLevel('INFO');
}

var dbPath = path.join(__dirname , "project.db");


if(argv.indexOf('--project') >= 0){
    GLOBAL.pjconfig =  require(path.join(__dirname , 'project.debug.json'));
}else {
    GLOBAL.pjconfig = require(path.join(__dirname , 'project.json') );
}


var zmq = require(GLOBAL.pjconfig.mq.module);

var readyClient = [];
var clientMapping = {};
var appKeyList = {
    appkey : {},
    idMappingKey : {}
};

//var MAX_TIMEOUT = 60*60*1000 * 15;
var MAX_TIMEOUT = 1000 * 60 * 15;

mq = zmq.socket('sub');
mq.connect("tcp://" + GLOBAL.pjconfig.dispatcher.address +":"+GLOBAL.pjconfig.dispatcher.port);
mq.subscribe("badjs");

setInterval(function () {

    var now = Date.now();
    var shouldRemove = [];
    readyClient.forEach(function (value) {
        if (now - value.ext.timeout > MAX_TIMEOUT) {
            shouldRemove.push(value);
        }
    })

    shouldRemove.forEach(function (value) {
        logger.info("timeout for close : " + value.ext.id)
        value.destroy();
    });

    logger.info('timeout detection , current length of  client is ' + readyClient.length);

}, MAX_TIMEOUT);


var processProjectId = function (str){
    var map = {appkey:{} , idMappingKey : {}};

    var json = JSON.parse(str || '{}');

    _.each(json , function (value , id){
        if(value){
            var appkey = value.appkey;
            map.appkey[appkey] = true;
            map.idMappingKey[id ] = appkey;
        }
    });
    return map;
}

var startService = function () {

    appKeyList = processProjectId(fs.readFileSync(dbPath, "utf-8"));

    process.once("disconnect" , function (){
        logger.info("master is exited , exiting... ")
        process.exit(0);
    })


    connect()
        .use('/getProjects', connect.query())
        .use('/getProjects', connect.bodyParser())
        .use('/getProjects', function (req, res) {

            var param = req.query;
            if (req.method == "POST") {
                param = req.body;
            }


            if (param.auth != "badjsOpen" || !param.projectsInfo) {

            } else {

                appKeyList = processProjectId(param.projectsInfo );

                fs.writeFile(dbPath, param.projectsInfo , function () {
                    logger.info('update project.db :' + param.projectsInfo);
                });
            }
            res.writeHead(200);
            res.end();

        })
        .listen(GLOBAL.pjconfig.openapi.syncProjects.port);
}


var processClientMessage = function (msg, client) {

    switch (msg.type) {
        case "auth" :
            if (appKeyList.appkey[msg.appkey]) {
                client.ext.appkey = msg.appkey;
                if(!clientMapping[msg.appkey]){
                    clientMapping[msg.appkey] = {};
                }
                clientMapping[msg.appkey][client.ext.id] = client;
                client.write(JSON.stringify({"err" : 0 , msg: "auth success" , type: "auth"}));
                logger.info("one client auth succ , appkey is " + msg.appkey);
            }else {
                client.write(JSON.stringify({"err" : -1 , msg: "auth fail" , type: "auth"}));
                logger.info("one client auth fail , appkey is " + msg.appkey);
                client.destroy();
            }
            break;
        case "keepalive" :
            client.ext.timeout = new Date - 0;
            client.write(JSON.stringify({"err" : 0 , msg: "keepalive" , type: "keepalive"}));
            break;
        default :
            client.write(JSON.stringify({"err" : -2 , msg: "should auth " , type: "auth"}));
            client.destroy();
            break;
    }
}


var removeClient = function (client) {
    var index = "flag";
    for (var i = 0; i < readyClient.length; i++) {
        if (readyClient[i].ext.id == client.ext.id) {
            index = i;
            break;
        }
    }

    if (index == "flag") {
        return;
    }

    readyClient.splice(index, 1);

    if (clientMapping[client.ext.appkey]) {
        delete clientMapping[client.ext.appkey][client.ext.id];
    }


}


mq.on("message", function (data) {

    if(!readyClient.length){
        return ;
    }

    try{
        var dataStr = data.toString();
        data = JSON.parse(dataStr.substring(dataStr.indexOf(' ')));
    }catch (e){
        logger.error('parse error');
        return ;
    }

    var appkey = appKeyList.idMappingKey[data.id +""];

    var message = data;
    var sendingClients = clientMapping[appkey];
    if (sendingClients) {
        _.each(sendingClients, function (value) {
            value.write(JSON.stringify({type: "message", msg: message , err : 0}));
        })
    }
})


var server  = net.createServer(function (c) { //'connection' listener
    c.ext = {
        id: crypto.createHash("md5").update(new Date - 0 + c.address().address).digest('hex'),
        timeout: new Date - 0,
        appkey: ''
    };

    readyClient.push(c);

    logger.info('client connected , id=' + c.ext.id);

    c.on('data', function (data) {
        try{
          var data = JSON.parse(data.toString());
          processClientMessage(data, this);
        }catch(e){
          this.destroy();
          removeClient(this);
          logger.info("client parse error , and close :" + e)
        }
    });

    c.on('close', function () {
        removeClient(this);
        logger.info("client disconnected , id=" + this.ext.id);
    })

});


startService();

server.listen( GLOBAL.pjconfig.openapi.port, function () { //'listening' listener
    logger.info("start openapi service , port:" +  GLOBAL.pjconfig.openapi.port )
});
