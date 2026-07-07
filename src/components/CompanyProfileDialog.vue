<template>
  <el-dialog v-model="visible" title="公司资料" width="500px" @close="$emit('close')">
    <el-form label-width="100px" v-loading="loading">
      <el-form-item label="公司名称"><el-input :model-value="form.company_name" disabled /></el-form-item>
      <el-form-item label="用户名"><el-input :model-value="form.login_username" disabled /></el-form-item>
      <el-form-item label="联系人"><el-input :model-value="form.contact_person" disabled /></el-form-item>
      <el-form-item label="联系电话"><el-input :model-value="form.contact_phone" disabled /></el-form-item>
      <el-form-item label="地址"><el-input :model-value="form.address" type="textarea" :rows="2" disabled /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref, reactive, watch } from 'vue'
import { getCurrentUserApi } from '@/api/auth'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])
const loading = ref(false)
const form = reactive({ company_name: '', login_username: '', contact_person: '', contact_phone: '', address: '' })

watch(() => props.visible, async (v) => { if (v) await loadProfile() })

async function loadProfile() {
  loading.value = true
  try {
    const res = await getCurrentUserApi()
    const d = res.data || {}
    form.company_name = d.company_name || d.company?.company_name || ''
    form.login_username = d.login_username || d.username || ''
    form.contact_person = d.contact_person || d.legal_representative || ''
    form.contact_phone = d.contact_phone || ''
    form.address = d.address || ''
  } catch {}
  finally { loading.value = false }
}
</script>
