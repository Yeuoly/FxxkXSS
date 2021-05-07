<template>
    <el-container class="px3">
        <el-row>
            <el-col :span="24" class="py2">
                <el-input placeholder="请输入资源域名（公网域名）" v-model.lazy="source_domain">
                    <template slot="prepend">资源域名</template>
                </el-input>
            </el-col>
            <el-col :span="24" class="py2">
                <el-input placeholder="请输入代理域名（内网域名）" v-model.lazy="proxy_domain">
                    <template slot="prepend">代理域名</template>
                </el-input>
            </el-col>
            <el-col :span="12" class="py2 pr2">
                <el-input placeholder="请输入资源内网端口" v-model.number="source_port_local">
                    <template slot="prepend">资源内网端口</template>
                </el-input>
            </el-col>
            <el-col :span="12" class="py2">
                <el-input placeholder="请输入资源外网端口" v-model.number="source_port_remote">
                    <template slot="prepend">资源外网端口</template>
                </el-input>
            </el-col>
            <el-col :span="12" class="py2 pr2">
                <el-input placeholder="请输入WS内网端口" v-model.number="ws_port_local">
                    <template slot="prepend">WS内网端口</template>
                </el-input>
            </el-col>
            <el-col :span="12" class="py2">
                <el-input placeholder="请输入WS外网端口" v-model.number="ws_port_remote">
                    <template slot="prepend">WS外网端口</template>
                </el-input>
            </el-col>
            <el-col :span="12" class="py2 pr2">
                <el-input placeholder="请输入代理端口" v-model.number="proxy_port_local">
                    <template slot="prepend">代理端口</template>
                </el-input>
            </el-col>
            <el-col :span="12" class="py2">
                <el-input placeholder="请输入代理超时" v-model.number="proxy_timeout">
                    <template slot="prepend">代理超时</template>
                    <template slot="append">ms</template>
                </el-input>
            </el-col>
            <el-col :span="24" class="py2">
                <el-switch v-model="ssl" :active-text="`${ssl ? '开启' : '关闭' }HTTPS/WSS`"></el-switch>
            </el-col>
            <el-col :span="24" class="py2">
                <el-input placeholder="请输入证书KEY" v-model="ssl_key">
                    <template slot="prepend">证书KEY</template>
                </el-input>
            </el-col>
            <el-col :span="24" class="py2">
                <el-input placeholder="请输入证书CERT" v-model="ssl_cert">
                    <template slot="prepend">证书CERT</template>
                </el-input>
            </el-col>
        </el-row>
    </el-container>
</template>

<script>
import { getMainConfig, setMainConfig } from '../module/config';

export default {
    name : 'Config',
    data : () => ({
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
    }),
    methods : {
        async init(){
            const config = await getMainConfig();
            for(let i in config){
                this[i] = config[i];
                this.$watch(i, val => setMainConfig(i, val));
            }
        }
    },
    mounted(){
        this.init();
    }
}
</script>