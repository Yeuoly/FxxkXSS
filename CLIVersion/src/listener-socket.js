import { isSSL, sslCert, sslKey, ws_port_local } from './conf.js';

/**
 * 这里是创建本地监听的地方，开启一个本地监听用于和被xss的浏览器建立连接
 */
import ws from 'ws';
import http from 'http';
import https from 'https';
import { readFileSync } from 'fs';
import { addNewDefaultLog } from './utils/index.js';

export default class WebSocketListener {
    constructor(port, callback, stop){
        try{
            this.sslkey = readFileSync(sslKey());
            this.sslCert = readFileSync(sslCert());
        }catch(e){}
        
        if(isSSL() && this.sslCert && this.sslkey){
            this.app = https.createServer({
                key : this.sslkey,
                cert : this.sslCert,
            }, (req, res) => {
                res.end('302');
            }).listen(port);
        }else{
            this.app = http.createServer((req, res) => {
                res.end('302');
            }).listen(port);
        }

        this.wss = new ws.Server({
            server : this.app
        });
        this.con_id = 0;
        this.message_queue = [];
        this.wss.on('connection', (ws, req) => {
            //获取到新连接后首先分配id
            const id = this.con_id++;
            //然后处理事件，每一个id下的事件都需要单独处理
            callback(ws, id, req);
            ws.on('close', () => {
                typeof stop === 'function' && stop(id);
            });
        });
        setTimeout(() => {
            addNewDefaultLog('CORE', `XSS websocket server has started on local port : ${ws_port_local()}`, 'green');
        })
    }
}