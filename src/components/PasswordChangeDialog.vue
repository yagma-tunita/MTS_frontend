<template>
  <el-dialog v-model="dialogVisible" title="修改密码" width="420px" @close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="原密码" prop="old_password">
        <el-input v-model="form.old_password" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="new_password">
        <el-input v-model="form.new_password" type="password" show-password />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirm_password">
        <el-input v-model="form.confirm_password" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { shipperChangePasswordApi, shippingChangePasswordApi } from '@/api/auth'
import { adminChangePasswordApi } from '@/api/admin'

const props = defineProps({
  visible: Boolean,
  role: String,
  userId: String
})

const emit = defineEmits(['success', 'close'])

const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref(null)

watch(() => props.visible, (v) => { dialogVisible.value = v })

const form = ref({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const validateConfirm = (rule, value, callback) => {
  if (value !== form.value.new_password) {
    callback(new Error('两次输入的新密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '密码长度至少6位', trigger: 'blur' }],
  confirm_password: [{ required: true, message: '请确认新密码', trigger: 'blur' }, { validator: validateConfirm, trigger: 'blur' }]
}

const apiMap = {
  shipper: shipperChangePasswordApi,
  shipping: shippingChangePasswordApi,
  admin: adminChangePasswordApi
}

function handleClose() {
  form.value = { old_password: '', new_password: '', confirm_password: '' }
  emit('close')
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const api = apiMap[props.role]
    await api(props.userId, { old_password: form.value.old_password, new_password: form.value.new_password })
    ElMessage.success('密码修改成功')
    emit('success')
    handleClose()
  } catch (e) { ElMessage.error(e.message || '密码修改失败')
  } finally {
    loading.value = false
  }
}
</script>
