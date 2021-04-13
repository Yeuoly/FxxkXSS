<template>
    <div class="holder">
        <el-select size="small" style="padding-bottom: 2px; float: right" v-model="log.current_index">
            <el-option v-for="(t, p) in log.sessions" 
                :key="p"
                :label="`${t.ip} - ${t.id}`"
                :value="p"
            ></el-option>
        </el-select>
        <div class="px2 py3">
            <LED :boot="current_session.alive" :prepend="status" />
        </div>
        <div class="logger">
            <div
                v-for="( i, key ) in current_session.logs"
                :key ="key"
                :class="'log ' + i.class_name"
            >
                <span v-html="i.log"></span>
            </div>
        </div>
        <input type="text" class="command-input" v-model="command" @keypress="sendSingleLine">
    </div>
</template>

<script>

import LED from '../components/common/LED';
import { log, evalOneLine, evalOneLineByIndex } from '../module/xss_core';

export default {
    name : 'Logger',
    components : { LED },
    data : () => ({
        log,
        command : '',
    }),
    methods : {
        sendSingleLine(ev){
            if(ev.key === 'Enter'){
                evalOneLineByIndex(log.current_index, this.command);
            }
        }
    },
    computed : {
        current_session(){
            return this.log.sessions[log.current_index];
        },
        status(){
            return this.current_session.alive ? '连接正常' : '连接已断开';
        }
    }
}
</script>

<style scoped>
    .green{
        color: green;
    }
    .red{
        color: red;
    }
    .grey{
        color: grey;
    }
    .orange{
        color: orange;
    }
    .log{
        min-height: 15px;
        font-size: 12px;
        padding: 0;
        margin-top: 0;
        margin-bottom: 0;
        word-break: break-all;
    }
    .holder{
        padding-right: 2px;
        margin: 0;
        border: 0;
        height: 516px;
        font-family: "Roboto", "Helvetica", "Arial", sans-serif;
        font-size: 1rem;
        line-height: 1.5;
        color: rgba(0, 0, 0, 0.87);
    }
    .logger{
        background-color: #272822;
        height: calc(100% - 15px);
        width: 100%;
        position: relative;
        overflow-y: scroll;
    }

    .command-input{
        background-color: #272822;
        border: 0;
        height: 20px;
        width: 100%;
        color: white;
        padding-top: 2px;
        padding-bottom: 4px;
    }

    /*定义滚动条高宽及背景 高宽分别对应横竖滚动条的尺寸*/
    ::-webkit-scrollbar
    {
        width: 8px;
        height: 8px;
        /* background-color: rgb(240,240,240); */
    }
 
    /*定义滚动条轨道 内阴影+圆角*/
    ::-webkit-scrollbar-track
    {
        /*-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);*/
        /*border-radius: 10px;*/
        /* background-color: rgb(30,30,30); */
    }
 
    /*定义滑块 内阴影+圆角*/
    ::-webkit-scrollbar-thumb
    {
        border-radius: 10px;
        -webkit-box-shadow: inset 0 0 6px rgba(193,193,193);
        background-color: rgb(193,193,193);
    }
</style>