<template>
    <div>
        <el-dialog title="重命名payload"
            :visible.sync="show_dialog"
            width="30%"
        >
            <el-input type="text" v-model="payloads.payloads[payloads.current_id].title" />
        </el-dialog>
        <el-row>
            <el-col :span="24">
                <el-col :span="6" class="pr1">
                    <el-button size="small" round type="primary" @click="send()" class="w100">发送当前payload</el-button>
                </el-col>
                <el-col :span="3" class="pr1">
                    <el-button size="small" round @click="rename()" class="w100" title="保存">命名</el-button>
                </el-col>
                <el-col :span="2" class="pr1">
                    <el-button size="small" round @click="newCode()" class="w100" title="新增">+</el-button>
                </el-col>
                <el-col :span="2" class="pr1">
                    <el-button size="small" round @click="deleteCurrent()" class="w100" title="删除">-</el-button>
                </el-col>
                <el-col :span="11">
                    <el-select style="padding-bottom: 2px;" v-model="payloads.current_id" size="small" class="w100">
                        <el-option v-for="(t, i) in payloads.payloads" :key="i"
                            :label="t.title"
                            :value="i"
                        >
                        </el-option>
                    </el-select>
                </el-col>
            </el-col>
        </el-row>
        <editor v-model="payloads.payloads[payloads.current_id].code" lang="javascript" theme="chrome" height="528" ref="coder"></editor>
    </div>
</template>

<script>
require('vue2-ace-editor')
require('brace/ext/language_tools');              
require('brace/mode/javascript')
require('brace/theme/monokai')
require('brace/snippets/javascript') //snippet

import { payloads, evalMultByIndex, getCurrentIndex, savePayloads } from '../module/xss_core';

import { MessageBox } from 'element-ui';

export default {
    name : 'CodePad',
    components : { 
        editor: require('vue2-ace-editor')
    },
    data : () => ({
        payloads,
        show_dialog : false
    }),
    methods : {
        send(){
            const payload = payloads.payloads[payloads.current_id];
            evalMultByIndex(getCurrentIndex(), payload.code, payload.title);
        },
        newCode(){
            payloads.payloads.push({
                code : 'eval("amazing xss!")',
                title : 'new-payload'
            });
        },
        save(){
            savePayloads();
        },
        deleteCurrent(){
            //先判断一下避免数组越界
            if(this.payloads.payloads.length === this.payloads.current_id + 1){
                if(this.payloads.payloads.length === 1){
                    MessageBox('只剩一个了，不能再删除了', '错误', 'danger');
                    return;
                }
                this.payloads.current_id--;
            }
            this.payloads.payloads.splice(this.payloads.current_id, 1);
            savePayloads();
        },
        rename(){
            this.show_dialog = true;
        }
    },
    mounted(){
        setTimeout(() => {
            const coder = this.$refs.coder.editor;
            coder.setTheme('ace/theme/monokai');
            coder.setOptions({
                enableLiveAutocompletion : true
            });
            coder.container.style.fontSize = '16px'
        });
        setInterval(() => {
            //轮询保存
            savePayloads();
        }, 10000);
    }
}
</script>

<style>
    
</style>