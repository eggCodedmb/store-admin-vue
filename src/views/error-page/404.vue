<template>
  <div class="error-page">
    <h1>404</h1>
    <p>抱歉，您访问的页面不存在或没有权限。</p>
    <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
  </div>
</template>
<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>
