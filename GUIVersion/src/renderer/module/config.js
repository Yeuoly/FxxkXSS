import { ipcRenderer } from "electron";

/**
 * 获取主进程的设置（如ws端口、proxy域名等）
 */
const applies = [];
let apply_count = 0;

ipcRenderer.on('config.rev', (ev, id, data) => {
    for(const i in applies){
        if(applies[i].id === id){
            applies[i].callback(data);
            applies.splice(i, 1);
            break;
        }
    }
});

export const getMainConfig = key => new Promise(async resolve => {
    const id = apply_count++;
    const apply = {
        key : key,
        id : id,
        callback(data){
            resolve(data === undefined ? '不存在的键值' : data);
        }
    }
    applies.push(apply);
    ipcRenderer.send('config.get', id, key);
});

export const setMainConfig = (key, value) => {
    ipcRenderer.send('config.set', key, value);
}