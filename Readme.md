#badjs-message

> Message-queue system 

# 启动参数
--debug  log 采用debug 级别, 默认使用info 

--project 使用测试环境（ project.debug.json ）配置 ， 默认使用 project.json

# 配置说明
```
{
    "dispatcher": {  // 分发出去的地址
        "port": 10000,
        "address": "10.143.132.205"
    },
    "acceptor": {   // 接受数据的地址
        "port": 10001,
        "address": "127.0.0.1"
    },
    "mq" : {
        "module" : "axon"  // 指定mq 模块
    }
}
```
