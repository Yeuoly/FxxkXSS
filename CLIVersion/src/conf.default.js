const config = {
    source_domain : '',
    source_port_local : 10092,
    source_port_remote : 25568,
    ws_port_local : 10091,
    ws_port_remote : 25567,
    proxy_domain : '',
    proxy_timeout : 100000,
    proxy_port_local : 10093,
    ssl : true,
    ssl_key : '',
    ssl_cert : '',
};

export const exclude_headers = [
    'COOKIE', 'ACCEPT-ENCODING', 'USER-AGENT', 'HOST', 'REFERER', 'ORIGIN', 'CACHE-CONTROL', 'PRAGMA', 'ACCEPT-LANGUAGE',
    'PROXY-CONNECTION', 'SEC-FETCH-DEST', 'SEC-FETCH-MODE', 'SEC-FETCH-SITE', 'ACCEPT', 'UPGRADE-INSECURE-REQUESTS', 'X-XSS-ORIGIN',
    'CONTENT-LENGTH'
];

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