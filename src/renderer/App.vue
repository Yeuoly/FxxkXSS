<template>
  <div id="app">
    <Side></Side>
      <div id="app-c-1">
        <keep-alive>
          <router-view></router-view>
        </keep-alive>
      </div>
  </div>
</template>

<script>
  import Side from '@/layout/Side.vue';
  import { addXSSListener, addNewConListener, addCloseConListener, addNewLog } from './module/xss_core';

  export default {
    components : { Side },
    name: 'fuckxss',
    data : () => ({
      cons : []
    }),
    mounted(){
      addNewConListener(id => {
        this.cons.push(id);
        addXSSListener(id, data => {
          addNewLog(id, 'CLIENT-MSG', data, 'green');
        });
        addCloseConListener(id, () => {
          console.log('close-con:' + id);
        });
      });
    }
  }
</script>

<style>
body, div{
    padding: 0;
    margin: 0;
    border: 0;
    display: block;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#app-c-1{
    width: 990px;
    float: left;
    text-align: left;
}
</style>
