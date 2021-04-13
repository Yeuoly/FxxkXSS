<template>
    <el-menu default-active="1-1" class="el-menu-vertical">
        <el-menu-item v-for="(t, i) in menus" :key="i" :index="`${i}`" @click="router(t.path)">
            <template slot="title">
                <i :class="t.meta.icon"></i>
                <span slot="title">{{ t.meta.title }}</span>
            </template>
        </el-menu-item>
    </el-menu>
</template>

<script>
import routes from '@/router/route';

export default {
    name : 'Side',
    data(){
        //初始化菜单
        const menus = routes;
        return {
            menus: menus.slice(0, menus.length - 1)
        }
    },  
    methods : {
        router(route){
            this.$router.push({
                path : route
            });
        }
    }
}
</script>

<style>
.el-menu-vertical{
    width: 200px;
    float: left;
    min-height: 100vh;
    z-index: 100;
    text-align: left;
}

</style>