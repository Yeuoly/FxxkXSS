import { isSSL, sslCert, sslKey } from '../conf';

/**
 * 这里是创建本地监听的地方，开启一个本地监听用于和被xss的浏览器建立连接
 */
const ws = require('ws');

export default class WebSocketListener {
    constructor(port, callback, stop){
        try{
            const { readFileSync } = require('fs');
            this.sslkey = readFileSync(sslKey());
            this.sslCert = readFileSync(sslCert());
        }catch(e){}
        
        if(isSSL() && this.sslCert && this.sslkey){
            this.app = require('https').createServer({
                key : this.sslkey,
                cert : this.sslCert,
            }, (req, res) => {
                res.end('302');
            }).listen(port);
        }else{
            this.app = require('http').createServer((req, res) => {
                res.end('302');
            }).listen(port);
        }

        this.wss = new ws.Server({
            server : this.app
        });
        this.con_id = 0;
        this.message_queue = [];
        this.wss.on('connection', (ws, req) => {
            const ip = req.socket.remoteAddress;
            //获取到新连接后首先分配id
            const id = this.con_id++;
            //然后处理事件，每一个id下的事件都需要单独处理
            callback(ws, id, {
                ip : 'none'
            });
            ws.on('close', () => {
                typeof stop === 'function' && stop(id);
            });
        });
    }
}