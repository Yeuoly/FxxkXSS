export default [
    {
      path: '/',
      name: 'index',
      component: require('@/views/Index.vue').default,
      meta : {
          title : '主页',
          icon : 'el-icon-view'
      }
    },
    {
      path : '/config',
      name : 'config',
      component: require('@/views/Config.vue').default,
      meta : {
        title : '设置',
        icon : 'el-icon-setting'
      }
    },
    {
      path : '/guide',
      name : 'guide',
      component: require('@/views/Guide.vue').default,
      meta : {
        title : '教程',
        icon : 'el-icon-position'
      }
    },
    {
      path: '*',
      redirect : '/'
    }
];