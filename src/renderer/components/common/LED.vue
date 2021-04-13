<template>
  <div>
      <div class="LED-prepend pr3">{{prepend || ''}}</div>
      <div class="LED-light" :style="{ backgroundColor: color }"></div>
  </div>
</template>

<script>
export default {
    name : 'LED',
    props : ['boot','prepend'],
    computed: {
        color(){
            return this.boot ? 'lightseagreen' : 'red';
        }
    },
}
</script>

<style>
    .LED-light{
        float: left;
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }
    .LED-prepend{
        float: left;
        font-size: 12px;
        height: 10px;
        line-height: 1;
        color: grey;
    }
</style>