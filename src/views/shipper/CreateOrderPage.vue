<template>
  <div class="create-order-page">
    <el-card shadow="never">
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="选择港口" /><el-step title="航程推荐" /><el-step title="货物信息" /><el-step title="联系方式" /><el-step title="确认提交" />
      </el-steps>
      <div class="step-content">
        <div v-show="activeStep === 0">
          <el-form ref="step1Ref" :model="formData" :rules="step1Rules" label-width="120px">
            <el-form-item label="出发城市" prop="departure_city_id">
              <el-select v-model="formData.departure_city_id" placeholder="选择出发城市" @change="loadPorts('departure')" style="width: 300px">
                <el-option v-for="c in cities" :key="c.city_id" :label="c.city_name" :value="c.city_id" />
              </el-select>
            </el-form-item>
            <el-form-item label="起运港" prop="start_port_id">
              <el-select v-model="formData.start_port_id" placeholder="选择起运港" style="width: 300px">
                 <el-option v-for="p in departurePorts" :key="p.port_id" :label="p.port_name + (p.city?.country ? ' (' + p.city.country + ')' : '')" :value="p.port_id" />
              </el-select>
            </el-form-item>
            <el-form-item label="目的城市" prop="destination_city_id">
              <el-select v-model="formData.destination_city_id" placeholder="选择目的城市" @change="loadPorts('destination')" style="width: 300px">
                <el-option v-for="c in cities" :key="c.city_id" :label="c.city_name" :value="c.city_id" />
              </el-select>
            </el-form-item>
            <el-form-item label="目的港" prop="end_port_id">
              <el-select v-model="formData.end_port_id" placeholder="选择目的港" style="width: 300px">
                 <el-option v-for="p in destinationPorts" :key="p.port_id" :label="p.port_name + (p.city?.country ? ' (' + p.city.country + ')' : '')" :value="p.port_id" />
              </el-select>
            </el-form-item>
            <el-form-item label="预估吨位(吨)" prop="required_ton">
              <el-input-number v-model="formData.required_ton" :min="1" :step="10" />
            </el-form-item>
          </el-form>
        </div>
        <div v-show="activeStep === 1">
          <div v-if="recommendations.length === 0 && !recommending" style="text-align:center;padding:40px 0;color:#8c8c8c;">正在搜索可用航程...</div>
          <el-table :data="recommendations" v-loading="recommending" stripe style="width: 100%">
            <el-table-column prop="LineName" label="航线" />
            <el-table-column prop="VesselName" label="船舶" />
            <el-table-column prop="VoyageDate" label="出发日期" width="160" />
            <el-table-column prop="RemainingCapacity" label="可用容量(吨)" width="140" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }"><el-radio v-model="selectedVoyage" :label="row" @change="onVoyageSelect(row)">选择</el-radio></template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!recommending && recommendations.length === 0" description="未找到可用航线，请返回修改起止港" />
        </div>
        <div v-show="activeStep === 2">
          <el-button type="primary" @click="addCargo" style="margin-bottom: 16px">添加货物</el-button>
          <el-table :data="formData.cargos" stripe style="width: 100%">
            <el-table-column label="货物名称" width="180"><template #default="{ row }"><el-input v-model="row.cargo_name" placeholder="货物名称" size="small" /></template></el-table-column>
            <el-table-column label="类型" width="140"><template #default="{ row }"><el-select v-model="row.cargo_type" placeholder="类型" size="small" style="width: 100%"><el-option label="散货" value="bulk" /><el-option label="集装箱" value="container" /><el-option label="液体" value="liquid" /></el-select></template></el-table-column>
            <el-table-column label="数量" width="100"><template #default="{ row }"><el-input-number v-model="row.quantity" :min="1" size="small" style="width: 80px" /></template></el-table-column>
            <el-table-column label="重量(吨)" width="120"><template #default="{ row }"><el-input-number v-model="row.weight_ton" :min="0.1" :step="0.5" size="small" style="width: 100px" /></template></el-table-column>
            <el-table-column label="体积(m3)" width="120"><template #default="{ row }"><el-input-number v-model="row.volume_cub_m" :min="0" :step="0.5" size="small" style="width: 100px" /></template></el-table-column>
            <el-table-column label="操作" width="80"><template #default="{ $index }"><el-button type="danger" link size="small" @click="removeCargo($index)">删除</el-button></template></el-table-column>
          </el-table>
        </div>
        <div v-show="activeStep === 3">
          <el-form :model="formData" label-width="140px">
            <el-divider content-position="left">联系人信息</el-divider>
            <el-form-item label="发货联系人"><el-input v-model="formData.shipper_contact" placeholder="发货方联系人" style="width: 300px" /></el-form-item>
            <el-form-item label="收货联系人"><el-input v-model="formData.consignee_contact" placeholder="收货方联系人" style="width: 300px" /></el-form-item>
            <el-divider content-position="left">期望时间</el-divider>
            <el-form-item label="期望发货日期"><el-date-picker v-model="formData.expected_departure" type="date" placeholder="选择日期" style="width: 300px" value-format="YYYY-MM-DD" /></el-form-item>
            <el-form-item label="期望到货日期"><el-date-picker v-model="formData.expected_arrival" type="date" placeholder="选择日期" style="width: 300px" value-format="YYYY-MM-DD" /></el-form-item>
          </el-form>
        </div>
        <div v-show="activeStep === 4">
          <el-descriptions title="订单概览" :column="2" border>
            <el-descriptions-item label="起运港">{{ selectedDeparturePort?.port_name }}</el-descriptions-item>
            <el-descriptions-item label="目的港">{{ selectedDestinationPort?.port_name }}</el-descriptions-item>
            <el-descriptions-item label="航线">{{ selectedVoyage?.LineName }}</el-descriptions-item>
            <el-descriptions-item label="船舶">{{ selectedVoyage?.VesselName }}</el-descriptions-item>
            <el-descriptions-item label="货物数量">{{ formData.cargos.length }} 项</el-descriptions-item>
            <el-descriptions-item label="总重量">{{ totalWeight }} 吨</el-descriptions-item>
            <el-descriptions-item label="发货联系人">{{ formData.shipper_contact || '-' }}</el-descriptions-item>
            <el-descriptions-item label="收货联系人">{{ formData.consignee_contact || '-' }}</el-descriptions-item>
            <el-descriptions-item label="期望发货">{{ formData.expected_departure || '-' }}</el-descriptions-item>
            <el-descriptions-item label="期望到货">{{ formData.expected_arrival || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <div class="step-actions">
        <el-button v-if="activeStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="activeStep < 4" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="activeStep === 4" type="primary" :loading="submitting" @click="handleSubmit">提交订单</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { createOrderApi, getVoyageRecommendApi } from '@/api/order'
import { getCityListApi, getPortListApi } from '@/api/data'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeStep = ref(0)
const submitting = ref(false)
const recommending = ref(false)
const cities = ref([])
const departurePorts = ref([])
const destinationPorts = ref([])
const recommendations = ref([])
const selectedVoyage = ref(null)
const step1Ref = ref(null)

const formData = ref({
  departure_city_id: '', destination_city_id: '', start_port_id: '', end_port_id: '', required_ton: 10,
  cargos: [{ cargo_name: '', cargo_type: 'bulk', quantity: 1, weight_ton: 0, volume_cub_m: 0 }],
  shipper_contact: '', consignee_contact: '', expected_departure: '', expected_arrival: ''
})
const step1Rules = {
  departure_city_id: [{ required: true, message: '请选择出发城市', trigger: 'change' }],
  start_port_id: [{ required: true, message: '请选择起运港', trigger: 'change' }],
  destination_city_id: [{ required: true, message: '请选择目的城市', trigger: 'change' }],
  end_port_id: [{ required: true, message: '请选择目的港', trigger: 'change' }],
  required_ton: [{ required: true, message: '请输入预估吨位', trigger: 'blur' }]
}
const selectedDeparturePort = computed(() => departurePorts.value.find(p => p.port_id === formData.value.start_port_id))
const selectedDestinationPort = computed(() => destinationPorts.value.find(p => p.port_id === formData.value.end_port_id))
const totalWeight = computed(() => formData.value.cargos.reduce((s, c) => s + (c.weight_ton || 0), 0).toFixed(2))

watch(activeStep, async (val) => { if (val === 1) await loadRecommendations() })

async function loadCities() { try { const res = await getCityListApi(); cities.value = res.data || [] } catch { cities.value = [] } }
async function loadPorts(type) {
  const cityId = type === 'departure' ? formData.value.departure_city_id : formData.value.destination_city_id
  if (!cityId) return
  try { const res = await getPortListApi({ city_id: cityId }); const ports = res.data || []; if (type === 'departure') { departurePorts.value = ports; formData.value.start_port_id = '' } else { destinationPorts.value = ports; formData.value.end_port_id = '' } } catch { if (type === 'departure') departurePorts.value = []; else destinationPorts.value = [] }
}
async function loadRecommendations() {
  if (!formData.value.start_port_id || !formData.value.end_port_id) return
  recommending.value = true
  try { const res = await getVoyageRecommendApi({ start_port_id: formData.value.start_port_id, end_port_id: formData.value.end_port_id, required_ton: formData.value.required_ton }); recommendations.value = res.data || [] } catch { recommendations.value = [] }
  finally { recommending.value = false }
}
function onVoyageSelect(row) { selectedVoyage.value = row; ElMessage.success(`已选择航线: ${row.LineName}`) }
function addCargo() { formData.value.cargos.push({ cargo_name: '', cargo_type: 'bulk', quantity: 1, weight_ton: 0, volume_cub_m: 0 }) }
function removeCargo(index) { formData.value.cargos.splice(index, 1) }

async function nextStep() {
  if (activeStep.value === 0) { if (!step1Ref.value) return; try { await step1Ref.value.validate() } catch { return } }
  if (activeStep.value === 1 && !selectedVoyage.value) { ElMessage.warning('请先选择一条推荐航程'); return }
  if (activeStep.value === 2) { if (formData.value.cargos.some(c => !c.cargo_name || !c.weight_ton)) { ElMessage.warning('请完善货物信息'); return } }
  activeStep.value++
}
function prevStep() { if (activeStep.value > 0) activeStep.value-- }

async function handleSubmit() {
  const userId = localStorage.getItem('user_id')
  if (!userId) { ElMessage.error('用户信息丢失，请重新登录'); return }
  if (!formData.value.start_port_id || !formData.value.end_port_id) { ElMessage.warning('请先选择起运港和目的港'); return }
  if (!selectedVoyage.value) { ElMessage.warning('请先选择推荐航程'); return }
  submitting.value = true
  try {
    const toNum = v => (v === '' || v === null || v === undefined) ? undefined : Number(v)
    const payload = {
      shipper_company_id: Number(userId),
      city_id: toNum(formData.value.departure_city_id),
      line_id: toNum(selectedVoyage.value?.LineID),
      vessel_id: toNum(selectedVoyage.value?.VesselID),
      voyage_date: selectedVoyage.value?.VoyageDate,
      start_port_id: toNum(formData.value.start_port_id),
      end_port_id: toNum(formData.value.end_port_id),
      cargo_items: formData.value.cargos.map(c => ({
        cargo_name: c.cargo_name,
        cargo_type: c.cargo_type,
        quantity: Number(c.quantity),
        weight_ton: Number(c.weight_ton),
        volume_cub_m: Number(c.volume_cub_m)
      })),
      shipper_contact: formData.value.shipper_contact || undefined,
      consignee_contact: formData.value.consignee_contact || undefined,
      expected_departure: formData.value.expected_departure || undefined,
      expected_arrival: formData.value.expected_arrival || undefined
    }
    await createOrderApi(payload)
    ElMessage.success('订单创建成功'); router.push('/shipper/order/list')
  } catch (e) { ElMessage.error(e.message || '创建失败') }
  finally { submitting.value = false }
}
onMounted(loadCities)
</script>

<style scoped>
.create-order-page { padding: 20px; }
.step-content { margin: 40px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: center; gap: 16px; padding-top: 20px; border-top: 1px solid #ebeef5; }
</style>
