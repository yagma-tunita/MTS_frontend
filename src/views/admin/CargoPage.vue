<template>
  <div class="cargo-page">
    <el-card>
      <template #header>
        <span>货物类型管理</span>
        <div style="float:right">
          <el-button size="small" type="primary" @click="openCreate">添加货物类型</el-button>
        </div>
      </template>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="type_id" label="ID" width="60" />
        <el-table-column prop="type_name" label="类型名称" min-width="160" />
        <el-table-column prop="type_code" label="类型代码" width="140" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && list.length === 0" description="暂无货物类型，请添加" />
      <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" layout="total, sizes, prev, pager, next" @change="loadData" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑货物类型' : '添加货物类型'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="类型名称" prop="type_name">
          <el-input v-model="form.type_name" placeholder="如：散货、集装箱、液体" />
        </el-form-item>
        <el-form-item label="类型代码" prop="type_code">
          <el-input v-model="form.type_code" placeholder="如：bulk、container、liquid" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="描述（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCargoTypeManageListApi, createCargoTypeApi, updateCargoTypeApi, deleteCargoTypeApi } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const saving = ref(false)
const list = ref([])
const meta = ref({})
const query = reactive({ page: 1, page_size: 10 })
const dialogVisible = ref(false)
const isEdit = ref(false)
let editId = null
const form = reactive({ type_name: '', type_code: '', description: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await getCargoTypeManageListApi(query)
    list.value = res.data || []
    meta.value = res.meta || {}
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.type_name = ''
  form.type_code = ''
  form.description = ''
}

function openCreate() {
  isEdit.value = false
  editId = null
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  editId = row.type_id
  form.type_name = row.type_name
  form.type_code = row.type_code
  form.description = row.description || ''
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.type_name || !form.type_code) {
    ElMessage.warning('请填写类型名称和代码')
    return
  }
  saving.value = true
  try {
    if (isEdit.value && editId) {
      await updateCargoTypeApi(editId, { type_name: form.type_name, type_code: form.type_code, description: form.description || undefined })
      ElMessage.success('更新成功')
    } else {
      await createCargoTypeApi({ type_name: form.type_name, type_code: form.type_code, description: form.description || undefined })
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除货物类型 "${row.type_name}"？删除后货主将无法选择该类型。`, '提示')
    await deleteCargoTypeApi(row.type_id)
    ElMessage.success('已删除')
    await loadData()
  } catch { /* ignore */ }
}

onMounted(loadData)
</script>
