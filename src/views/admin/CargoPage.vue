<template>
  <div class="cargo-page">
    <el-card>
      <template #header>
        <span>货物列表</span>
        <div style="float: right; display: flex; gap: 8px">
          <el-autocomplete v-model="query.keyword" :fetch-suggestions="searchSuggestions" placeholder="搜索货物名称" clearable style="width: 200px" @select="onSearchSelect" @keyup.enter="handleSearch" />
          <el-button size="small" @click="handleSearch">搜索</el-button>
          <el-button size="small" type="primary" @click="openCreate">添加货物</el-button>
        </div>
      </template>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="detail_id" label="ID" width="60" />
        <el-table-column prop="cargo_name" label="货物名称" min-width="150" />
        <el-table-column prop="cargo_type" label="类型" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="weight_ton" label="重量(吨)" width="90" />
        <el-table-column prop="volume_cubic_meter" label="体积(m3)" width="90" />
        <el-table-column label="关联订单" min-width="150"><template #default="{ row }">{{ row.order?.order_no || '-' }}</template></el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="170" />
        <el-table-column label="操作" min-width="120">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" layout="total, sizes, prev, pager, next" @change="loadData" />
    </el-card>
    <el-dialog v-model="createVisible" title="添加货物" width="500px">
      <el-form :model="createForm" label-width="110px">
        <el-form-item label="货物名称" prop="cargo_name"><el-input v-model="createForm.cargo_name" /></el-form-item>
        <el-form-item label="类型" prop="cargo_type"><el-input v-model="createForm.cargo_type" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="数量" prop="quantity"><el-input-number v-model="createForm.quantity" :min="0" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="重量(吨)" prop="weight_ton"><el-input-number v-model="createForm.weight_ton" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="体积(m3)" prop="volume_cubic_meter"><el-input-number v-model="createForm.volume_cubic_meter" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="关联订单" prop="order_id">
          <el-select v-model="createForm.order_id" filterable style="width: 100%"><el-option v-for="o in orders" :key="o.order_id" :label="orderLabel(o)" :value="o.order_id" /></el-select>
        </el-form-item>
        <el-form-item label="单价" prop="unit_price"><el-input-number v-model="createForm.unit_price" :min="0" :precision="2" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="createVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="handleCreate">添加</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCargoListApi, createCargoApi, deleteCargoApi } from '@/api/admin'
import { getOrderListApi } from '@/api/order'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false); const saving = ref(false); const list = ref([]); const meta = ref({}); const orders = ref([]); const searchOptions = ref([])
const query = reactive({ page: 1, page_size: 10, keyword: '' })
const createVisible = ref(false)
const createForm = reactive({ cargo_name: '', cargo_type: '', quantity: 0, weight_ton: 0, volume_cubic_meter: 0, order_id: null, unit_price: 0 })
function orderLabel(o) { return o.order_no || '订单#' + o.order_id }
async function loadData() { loading.value = true; try { const res = await getCargoListApi(query); list.value = res.data || []; meta.value = res.meta || {} } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false } }
function handleSearch() { query.page = 1; loadData() }
function openCreate() { createVisible.value = true; Object.assign(createForm, { cargo_name: '', cargo_type: '', quantity: 0, weight_ton: 0, volume_cubic_meter: 0, order_id: null, unit_price: 0 }) }
async function handleCreate() { if (!createForm.cargo_name) { ElMessage.warning('请填写货物名称'); return }; saving.value = true; try { await createCargoApi({ ...createForm }); ElMessage.success('添加成功'); createVisible.value = false; loadData() } catch (e) { ElMessage.error(e.message || '创建失败') } finally { saving.value = false } }
async function handleDelete(row) {
  try { await ElMessageBox.confirm('确认删除货物 "' + row.cargo_name + '"？', '提示'); await deleteCargoApi(row.detail_id); ElMessage.success('已删除'); loadData() } catch { /* ignore */ }
}
async function loadSearchOptions() { try { const res = await getCargoListApi({ page: 1, page_size: 200 }); searchOptions.value = (res.data || []).map(c => ({ value: c.cargo_name })) } catch {} }
function searchSuggestions(queryString, cb) { const r = queryString ? searchOptions.value.filter(s => s.value.includes(queryString)) : searchOptions.value; cb(r) }
function onSearchSelect(item) { query.keyword = item.value; handleSearch() }
onMounted(async () => { await loadData(); try { const res = await getOrderListApi({ page: 1, page_size: 100 }); orders.value = res.data || [] } catch {}; loadSearchOptions() })
</script>