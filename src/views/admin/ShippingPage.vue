<template>
  <div class="shipping-page">
    <el-card>
      <template #header><span>海运公司管理</span></template>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="company_id" label="ID" width="60" />
        <el-table-column prop="company_name" label="公司名称" min-width="180" />
        <el-table-column prop="contact_person" label="联系人" width="120" />
        <el-table-column prop="contact_phone" label="联系电话" width="140" />
        <el-table-column prop="login_username" label="用户名" width="120" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }"><el-tag :type="row.account_status === 1 ? 'success' : 'danger'" size="small">{{ row.account_status === 1 ? '正常' : '禁用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }"><el-button size="small" @click="openEdit(row)">编辑</el-button><el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button></template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" layout="total, sizes, prev, pager, next" @change="loadData" />
    </el-card>
    <el-dialog v-model="editVisible" title="编辑海运公司" width="500px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="公司名称" prop="company_name"><el-input v-model="editForm.company_name" /></el-form-item>
        <el-form-item label="用户名" prop="login_username"><el-input v-model="editForm.login_username" /></el-form-item>
        <el-form-item label="联系人" prop="contact_person"><el-input v-model="editForm.contact_person" /></el-form-item>
        <el-form-item label="联系电话" prop="contact_phone"><el-input v-model="editForm.contact_phone" /></el-form-item>
        <el-form-item label="地址" prop="address"><el-input v-model="editForm.address" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="状态" prop="account_status">
          <el-radio-group v-model="editForm.account_status"><el-radio :value="1">正常</el-radio><el-radio :value="0">禁用</el-radio></el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="handleSave">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getShippingListApi, updateShippingApi, deleteShippingApi } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false); const saving = ref(false); const list = ref([]); const meta = ref({})
const query = reactive({ page: 1, page_size: 10 }); const editVisible = ref(false)
const editForm = reactive({ company_name: '', login_username: '', contact_person: '', contact_phone: '', address: '', account_status: 1 })
let editId = null

async function loadData() { loading.value = true; try { const res = await getShippingListApi(query); list.value = res.data || []; meta.value = res.meta || {} } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false } }
function openEdit(row) { editId = row.company_id; editForm.company_name = row.company_name; editForm.login_username = row.login_username; editForm.contact_person = row.contact_person; editForm.contact_phone = row.contact_phone; editForm.address = row.address; editForm.account_status = row.account_status; editVisible.value = true }
async function handleSave() { if (!editId) return; saving.value = true; try { await updateShippingApi(editId, { ...editForm }); ElMessage.success('更新成功'); editVisible.value = false; await loadData() } catch (e) { ElMessage.error(e.message || '更新失败') } finally { saving.value = false } }
async function handleDelete(row) { try { await ElMessageBox.confirm(`确认删除海运公司 "${row.company_name}"？`, '提示'); await deleteShippingApi(row.company_id); ElMessage.success('已删除'); await loadData() } catch { /* ignore */ } }
onMounted(loadData)
</script>
