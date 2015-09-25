#badjs-message

> Message-queue system based on ZMQ.

# 启动参数
--debug  log 采用debug 级别

--project 使用测试环境（ project.debug.json ）配置

# 配置说明
{
    "dispatcher": {  // 分发出去的地址
        "port": 10000,
        "address": "10.143.132.205"
    },
    "acceptor": {   // 接受数据的地址
        "port": 10001,
        "address": "127.0.0.1"
    }
}
