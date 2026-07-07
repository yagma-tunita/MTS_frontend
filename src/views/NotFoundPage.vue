<template>
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;color:#8c8c8c;">
    <h1 style="font-size:72px;font-weight:700;color:#d9d9d9;margin:0;">404</h1>
    <p style="font-size:16px;margin:16px 0;">页面不存在</p>
    <el-button type="primary" @click="$router.push('/login')">返回首页</el-button>
  </div>
</template>
