<template>
    <el-row>
        <el-col :span="12">
          <logger></logger>
        </el-col>
        <el-col :span="12">
          <code-pad></code-pad>
        </el-col>
    </el-row>
</template>

<script>
import CodePad from '@/layout/CodePad.vue';
import Logger from '@/layout/Logger.vue';

export default {
    name : 'ViewIndex',
    components : { CodePad, Logger },
    data : () => ({

    })
}
</script>

<style>

</style>