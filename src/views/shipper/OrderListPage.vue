<template>
  <div class="order-list-page">
    <el-card>
      <template #header><span>订单管理</span></template>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单号"><el-input v-model="searchForm.order_no" placeholder="输入订单号" clearable /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.order_status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待确认" :value="0" /><el-option label="已确认" :value="1" />
            <el-option label="运输中" :value="2" /><el-option label="已完成" :value="3" /><el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">搜索</el-button><el-button @click="handleReset">重置</el-button></el-form-item>
      </el-form>
      <el-table :data="orders" border stripe v-loading="loading">
        <el-table-column prop="order_no" label="订单号" min-width="180" />
        <el-table-column label="起运港" min-width="120"><template #default="{ row }">{{ row.departure_port?.port_name || '-' }}</template></el-table-column>
        <el-table-column label="目的港" min-width="120"><template #default="{ row }">{{ row.destination_port?.port_name || '-' }}</template></el-table-column>
        <el-table-column prop="total_weight_ton" label="总重量(吨)" width="120" />
        <el-table-column label="总费用" width="130"><template #default="{ row }">¥{{ (row.total_cost || 0).toFixed(2) }}</template></el-table-column>
        <el-table-column prop="order_status" label="状态" width="110">
          <template #default="{ row }"><el-tag :type="tagType(row.order_status)" effect="dark" size="small">{{ tagLabel(row.order_status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.order_status === 0 || row.order_status === 1" size="small" type="danger" @click="handleCancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="loadOrders" style="margin-top: 16px; justify-content: flex-end" />
    </el-card>
    <el-dialog v-model="detailVisible" title="订单详情" width="700px">
      <el-descriptions v-if="current" :column="2" border>
        <el-descriptions-item label="订单号" :span="2">{{ current.order_no }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="tagType(current.order_status)" effect="dark">{{ tagLabel(current.order_status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="支付状态">{{ current.payment_status === 1 ? '已支付' : '未支付' }}</el-descriptions-item>
        <el-descriptions-item label="货主公司">{{ current.shipper_company?.company_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="城市">{{ current.city?.city_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="起运港">{{ current.departure_port?.port_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="目的港">{{ current.destination_port?.port_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预计离港">{{ formatShort(current.expected_departure_date) }}</el-descriptions-item>
        <el-descriptions-item label="预计到达">{{ formatShort(current.expected_arrival_date) }}</el-descriptions-item>
        <el-descriptions-item label="总重量(吨)">{{ current.total_weight_ton }}</el-descriptions-item>
        <el-descriptions-item label="总费用">¥{{ (current.total_cost || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ current.shipper_contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ current.consignee_contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(current.create_time) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(current.update_time) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getOrderListApi, cancelOrderApi } from '@/api/order'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const orders = ref([])
const meta = ref({})
const query = reactive({ page: 1, page_size: 10 })
const searchForm = reactive({ order_no: '', order_status: '' })
const detailVisible = ref(false)
const current = ref(null)
const tagType = s => ({ 0: 'info', 1: 'primary', 2: 'warning', 3: 'success', 4: 'danger' })[s] || 'info'
const tagLabel = s => ({ 0: '待确认', 1: '已确认', 2: '运输中', 3: '已完成', 4: '已取消' })[s] || s
const formatShort = d => d ? String(d).slice(0, 10) : '-'
const formatTime = t => t ? String(t).slice(0, 19).replace('T', ' ') : '-'

async function loadOrders() {
  loading.value = true
  try {
    const params = { ...query }
    if (searchForm.order_no) params.order_no = searchForm.order_no
    if (searchForm.order_status !== '' && searchForm.order_status !== null) params.order_status = searchForm.order_status
    const res = await getOrderListApi(params)
    orders.value = res.data || []
    meta.value = res.meta || {}
  } catch (e) { ElMessage.error(e.message || '加载失败') }
  finally { loading.value = false }
}
function handleSearch() { query.page = 1; loadOrders() }
function handleReset() { searchForm.order_no = ''; searchForm.order_status = ''; query.page = 1; loadOrders() }
async function handleCancel(row) {
  try { await ElMessageBox.confirm('确认取消该订单？', '提示'); await cancelOrderApi(row.order_id); ElMessage.success('已取消'); await loadOrders() } catch { /* ignore */ }
}
function viewDetail(row) { current.value = row; detailVisible.value = true }
onMounted(loadOrders)
</script>

<style scoped>
.order-list-page { padding: 20px; }
.search-form { margin-bottom: 16px; }
</style>
