<template>
  <el-card>
    <template #header>发送通知</template>
    <el-form :model="form" label-width="100px">
      <el-form-item label="用户ID" prop="user_id"><el-input-number v-model="form.user_id" :min="1" /></el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="form.role"><el-option label="货主" value="shipper" /><el-option label="海运公司" value="shipping" /><el-option label="管理员" value="admin" /></el-select>
      </el-form-item>
      <el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item>
      <el-form-item label="内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="4" /></el-form-item>
      <el-form-item><el-button type="primary" :loading="sending" @click="handleSend">发送</el-button></el-form-item>
    </el-form>
  </el-card>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { sendNotificationApi } from '@/api/notification'
import { ElMessage } from 'element-plus'
const sending = ref(false)
const form = reactive({ user_id: 1, role: 'shipper', title: '', content: '' })
async function handleSend() {
  if (!form.user_id) { ElMessage.warning('请输入用户ID'); return }
  sending.value = true; try { await sendNotificationApi({ ...form }); ElMessage.success('发送成功') } catch (e) { ElMessage.error(e.message || '发送失败') } finally { sending.value = false }
}
</script>
