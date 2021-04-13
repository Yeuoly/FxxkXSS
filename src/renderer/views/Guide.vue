<template>
    <el-container>
        <el-button @click="to">点我</el-button>
    </el-container>
</template>

<script>
import { shell } from 'electron';

export default {
    name : 'Guide',
    methods : {
        to(){
            shell.openExternal('https://ylday.srmxy.cn/post-page?pid=c6fc485707af90bd34b57393d8e6b812');
        }
    }
}
</script>

<style>

</style>