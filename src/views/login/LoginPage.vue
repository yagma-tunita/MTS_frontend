<!-- ===== 登录页面 ===== -->
<!-- 提供角色选择（货主/海运公司/管理员）+ 用户名密码登录，登录成功跳转对应角色仪表盘 -->
<template>
  <div class="login-page">
    <div class="login-left">
      <div class="login-left-content">
        <div class="login-logo">
          <el-icon :size="28" color="#1a5276"><Ship /></el-icon>
          <span>MTS 航运物流管理系统</span>
        </div>
        <div class="login-left-body">
          <h1>一站式海运运力交易<br>与订单管理平台</h1>
          <p>智能航线推荐 · 实时运力追踪 · 多角色协同管理</p>
        </div>
        <div class="login-left-footer">Copyright &copy; 2026 MTS. All rights reserved.</div>
      </div>
    </div>
    <div class="login-right">
      <div class="login-card">
        <h2 class="login-title">用户登录</h2>
        <p class="login-desc">请选择角色并输入您的账号信息</p>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="0" size="large" @keyup.enter="handleLogin">
          <el-form-item prop="role">
            <el-radio-group v-model="form.role" class="role-group">
              <el-radio-button value="shipper">货主</el-radio-button>
              <el-radio-button value="shipping">海运公司</el-radio-button>
              <el-radio-button value="admin">管理员</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">登 录</el-button>
          </el-form-item>
        </el-form>
        <div class="login-register">
          <span>还没有账号？</span>
          <el-link type="primary" :underline="false" @click="goRegister('shipper')">货主注册</el-link>
          <el-divider direction="vertical" />
          <el-link type="primary" :underline="false" @click="goRegister('shipping')">海运公司注册</el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ===== 登录页面逻辑 =====
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Ship } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { loginApi } from '@/api/auth'

// ---- 路由 & 表单状态 ----
const router = useRouter()
const formRef = ref()          // 表单引用，用于校验
const loading = ref(false)     // 登录按钮加载状态
const form = reactive({ role: 'shipper', username: '', password: '' })  // 登录表单数据
const rules = { role: [{ required: true, message: '请选择角色', trigger: 'change' }], username: [{ required: true, message: '请输入用户名', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }] }
const roleDashboard = { shipper: '/shipper/dashboard', shipping: '/shipping/dashboard', admin: '/admin/dashboard' }  // 角色 → 首页路由映射

// ---- 登录处理 ----
async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await loginApi({ username: form.username, password: form.password, role: form.role })
    const { access_token, refresh_token, role, user_id, company_name } = res.data
    localStorage.setItem('access_token', access_token); localStorage.setItem('refresh_token', refresh_token)
    localStorage.setItem('user_role', role); localStorage.setItem('user_id', String(user_id))
    localStorage.setItem('user_name', company_name || form.username)
    ElMessage.success('登录成功'); router.push(roleDashboard[role] || '/login')
  } catch (err) { ElMessage.error(err?.message || '登录失败') }
  finally { loading.value = false }
}
// ---- 跳转注册页 ----
function goRegister(role) { router.push({ path: '/register', query: { role } }) }
</script>

<style scoped>
/* ===== 登录页样式 ===== */
.login-page { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
.login-left { width: 480px; background: linear-gradient(180deg, #0d2847, #071a30); color: #fff; display: flex; flex-direction: column; flex-shrink: 0; }
.login-left-content { display: flex; flex-direction: column; height: 100%; padding: 32px; }
.login-logo { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; flex-shrink: 0; }
.login-left-body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.login-left-body h1 { font-size: 28px; font-weight: 700; line-height: 1.4; margin-bottom: 16px; }
.login-left-body p { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.6; }
.login-left-footer { font-size: 12px; color: rgba(255,255,255,0.35); flex-shrink: 0; }
.login-right { flex: 1; display: flex; align-items: center; justify-content: center; background: #d4d9d9; }
.login-card { width: 400px; padding: 40px; background: #f8f9fa; border: 1px solid #8a9ba8; border-radius: 4px; box-shadow: inset 0 1px 0 #fff, 0 2px 6px rgba(0,0,0,0.08); }
.login-title { font-size: 22px; font-weight: 700; color: #0d2847; margin-bottom: 6px; }
.login-desc { font-size: 13px; color: #5d6d7e; margin-bottom: 28px; }
.role-group { display: flex; width: 100%; }
.role-group { width: 100%; }
.role-group :deep(.el-radio-button__inner) { width: 130px; justify-content: center; font-size: 14px; padding: 4px 8px; }
.login-btn { width: 100%; height: 42px; font-size: 15px; margin-top: 8px; letter-spacing: 4px; }
.login-register { text-align: center; font-size: 13px; color: #8a9ba8; margin-top: 16px; }
</style>
