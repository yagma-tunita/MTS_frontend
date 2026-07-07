<template>
  <div class="register-page">
    <div class="register-left">
      <div class="register-left-content">
        <div class="register-logo"><el-icon :size="28" color="#1890ff"><Ship /></el-icon><span>MTS 航运物流管理系统</span></div>
        <div class="register-left-body"><h1>创建您的企业账号</h1><p>填写以下信息完成注册，开始使用航运物流管理平台</p></div>
        <div class="register-left-footer">Copyright &copy; 2026 MTS. All rights reserved.</div>
      </div>
    </div>
    <div class="register-right">
      <div class="register-card">
        <h2 class="register-title">{{ isShipper ? '货主注册' : '海运公司注册' }}</h2>
        <p class="register-desc">请填写企业信息创建账号</p>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="0" size="default" @keyup.enter="handleRegister">
          <el-row :gutter="16">
            <el-col :span="12"><el-form-item prop="company_name"><el-input v-model="form.company_name" placeholder="公司名称 *" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item prop="login_username"><el-input v-model="form.login_username" placeholder="登录用户名 *" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12"><el-form-item prop="password"><el-input v-model="form.password" type="password" placeholder="密码 *" show-password /></el-form-item></el-col>
            <el-col :span="12"><el-form-item prop="confirmPassword"><el-input v-model="form.confirmPassword" type="password" placeholder="确认密码 *" show-password /></el-form-item></el-col>
          </el-row>
          <el-form-item prop="unified_social_credit_code"><el-input v-model="form.unified_social_credit_code" placeholder="统一社会信用代码（选填）" /></el-form-item>
          <el-row :gutter="16">
            <el-col :span="12"><el-form-item prop="contactPerson"><el-input v-model="form.contactPerson" :placeholder="(isShipper ? '法定代表人' : '联系人') + '（选填）'" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item prop="contact_phone"><el-input v-model="form.contact_phone" placeholder="联系电话（选填）" /></el-form-item></el-col>
          </el-row>
          <el-form-item prop="address"><el-input v-model="form.address" placeholder="联系地址（选填）" type="textarea" :rows="2" /></el-form-item>
          <el-form-item><el-button type="primary" class="register-btn" :loading="loading" @click="handleRegister">注 册</el-button></el-form-item>
        </el-form>
        <div class="register-login"><span>已有账号？</span><el-link type="primary" :underline="false" @click="goLogin">立即登录</el-link></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Ship } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { shipperRegisterApi, shippingRegisterApi } from '@/api/auth'

const router = useRouter(); const route = useRoute()
const isShipper = computed(() => route.query.role === 'shipper')
const formRef = ref(); const loading = ref(false)
const form = reactive({ company_name: '', login_username: '', password: '', confirmPassword: '', unified_social_credit_code: '', contactPerson: '', contact_phone: '', address: '' })
const rules = {
  company_name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  login_username: [{ required: true, message: '请输入登录用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码不少于6位', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请确认密码', trigger: 'blur' }, { validator: (_r, v, cb) => v !== form.password ? cb(new Error('两次密码不一致')) : cb(), trigger: 'blur' }]
}

async function handleRegister() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const payload = { company_name: form.company_name, login_username: form.login_username, password: form.password }
    if (form.unified_social_credit_code) payload.unified_social_credit_code = form.unified_social_credit_code
    if (form.contactPerson) payload[isShipper.value ? 'legal_representative' : 'contact_person'] = form.contactPerson
    if (form.contact_phone) payload.contact_phone = form.contact_phone
    if (form.address) payload.address = form.address
    if (isShipper.value) await shipperRegisterApi(payload); else await shippingRegisterApi(payload)
    ElMessage.success('注册成功，请登录'); router.push('/login')
  } catch (err) { ElMessage.error(err?.message || '注册失败') }
  finally { loading.value = false }
}
function goLogin() { router.push('/login') }
</script>

<style scoped>
.register-page { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
.register-left { width: 480px; background: #001529; color: #fff; display: flex; flex-direction: column; flex-shrink: 0; }
.register-left-content { display: flex; flex-direction: column; height: 100%; padding: 32px; }
.register-logo { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; flex-shrink: 0; }
.register-left-body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.register-left-body h1 { font-size: 28px; font-weight: 700; margin-bottom: 12px; }
.register-left-body p { font-size: 14px; color: rgba(255,255,255,0.55); }
.register-left-footer { font-size: 12px; color: rgba(255,255,255,0.35); flex-shrink: 0; }
.register-right { flex: 1; display: flex; align-items: center; justify-content: center; background: #f0f2f5; }
.register-card { width: 520px; padding: 36px 40px; background: #fff; border: 1px solid #e8e8e8; }
.register-title { font-size: 22px; font-weight: 600; color: #262626; margin-bottom: 6px; }
.register-desc { font-size: 13px; color: #8c8c8c; margin-bottom: 24px; }
.register-btn { width: 100%; height: 40px; font-size: 14px; }
.register-login { text-align: center; font-size: 13px; color: #8c8c8c; margin-top: 12px; }
</style>
