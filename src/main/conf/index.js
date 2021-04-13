import { BrowserWindow, ipcMain } from 'electron';

const Store = require('electron-store');
const store = new Store();

const config = store.get('config.main', {
    source_domain : '',
    source_port_local : 10092,
    source_port_remote : 25568,
    ws_port_local : 10091,
    ws_port_remote : 25567,
    proxy_domain : '',
    proxy_timeout : 100000,
    proxy_port_local : 10093,
    ssl : false,
    ssl_key : '',
    ssl_cert : '',
});

const saveConfig = () => store.set('config.main', config);

/**
 * 处理渲染进程申请获取及更改设置的请求
 */
ipcMain.on('config.set', (ev, key, value) => {
    for(const i in config){
        if(i === key){
            config[i] = value;
            break;
        }
    }
    saveConfig();
});

ipcMain.on('config.get', (ev, id, key) => {
    const win = BrowserWindow.fromId(1).webContents;
    if(!key){
        win.send('config.rev', id, config);
    }else{
        let value = undefined;
        for(const i in config){
            if(i === key){
                value = config[i];
                break;
            }
        }
        win.send('config.rev', id, value);
    }
});

export const exclude_headers = [
    'COOKIE', 'ACCEPT-ENCODING', 'USER-AGENT', 'HOST', 'REFERER', 'ORIGIN', 'CACHE-CONTROL', 'PRAGMA', 'ACCEPT-LANGUAGE',
    'PROXY-CONNECTION', 'SEC-FETCH-DEST', 'SEC-FETCH-MODE', 'SEC-FETCH-SITE', 'ACCEPT', 'UPGRADE-INSECURE-REQUESTS', 'X-XSS-ORIGIN',
    'CONTENT-LENGTH'
]

export const source_domain = () => config.source_domain;

export const proxy_domain = () => config.proxy_domain;

export const proxy_timeout = () => config.proxy_timeout;

export const proxy_domain_len = () => config.source_domain.split(/[\.]/g).length;

export const source_port_local = () => config.source_port_local;

export const source_port_remote = () => config.source_port_remote;

export const ws_port_local = () => config.ws_port_local;

export const ws_port_remote = () => config.ws_port_remote;

export const proxy_port_local = () => config.proxy_port_local;

export const isSSL = () => config.ssl;

export const sslCert = () => config.ssl_cert;

export const sslKey = () => config.ssl_key;

export const setSourceDomain = domain => {
    config.source_domain = domain;
    saveConfig();
}

export const setSourcePortLocal = port => {
    config.source_port_local = port;
    saveConfig();
}

export const setSourceRemoteLocal = port => {
    config.source_port_remote = port;
    saveConfig();
}

export const setWsPortLocal = port => {
    config.ws_port_local = port;
    saveConfig();
}

export const setWsPortRemote = port => {
    config.ws_port_remote = port;
    saveConfig();
}

export const setProxyPortLocal = port => {
    config.proxy_port_local = port;
    saveConfig();
}

export const setProxyDomain = domain => { 
    config.source_port_local = domain;
    saveConfig();
}