<template>
  <div class="coupon-container">
    <!-- 顶部统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <el-icon size="24"><Ticket /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ total }}</span>
          <span class="stat-label">优惠券总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%)">
          <el-icon size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ activeCount }}</span>
          <span class="stat-label">进行中</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)">
          <el-icon size="24"><Collection /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalClaimed }}</span>
          <span class="stat-label">已领取</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <el-icon size="24"><Finished /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalUsed }}</span>
          <span class="stat-label">已使用</span>
        </div>
      </div>
    </div>

    <!-- 主表格卡片 -->
    <el-card class="table-card" shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="queryParams.type" placeholder="券类型" clearable @change="handleSearch" class="filter-select">
            <el-option label="满减券" :value="1" />
            <el-option label="折扣券" :value="2" />
            <el-option label="固定金额券" :value="3" />
          </el-select>
          <el-select v-model="queryParams.status" placeholder="状态" clearable @change="handleSearch" class="filter-select">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" round icon="Plus" @click="handleCreate">创建优惠券</el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="list"
        :header-cell-style="{ background: 'var(--el-fill-color-lighter)', color: 'var(--el-text-color-primary)', fontWeight: 600, fontSize: '13px' }"
        :row-style="{ height: '72px' }"
        class="coupon-table"
        height="calc(100vh - 480px)"
        style="width: 100%"
      >
        <el-table-column label="优惠券信息" min-width="240">
          <template #default="{ row }">
            <div class="coupon-info-cell">
              <div class="coupon-type-icon" :style="{ background: getTypeGradient(row.type) }">
                <el-icon size="18" color="#fff"><Ticket /></el-icon>
              </div>
              <div class="coupon-detail">
                <span class="coupon-name">{{ row.name }}</span>
                <span class="coupon-desc">{{ formatCouponDesc(row) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" effect="dark" round size="small">
              {{ getTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="面值" width="120" align="center">
          <template #default="{ row }">
            <span class="value-text">{{ formatValue(row) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="门槛" width="110" align="center">
          <template #default="{ row }">
            <span v-if="row.min_spend > 0" class="spend-text">满{{ row.min_spend }}元</span>
            <span v-else class="empty-text">无门槛</span>
          </template>
        </el-table-column>

        <el-table-column label="发放/领取" width="120" align="center">
          <template #default="{ row }">
            <div class="count-cell">
              <span class="count-text">{{ row.total_count === -1 ? '不限量' : row.claimed_count + '/' + row.total_count }}</span>
              <el-progress
                v-if="row.total_count !== -1"
                :percentage="Math.min(100, (row.claimed_count / row.total_count) * 100)"
                :stroke-width="4"
                :show-text="false"
                :color="row.claimed_count >= row.total_count ? '#e17055' : '#667eea'"
                class="count-progress"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="有效期" min-width="200" align="center">
          <template #default="{ row }">
            <div class="time-range">
              <span class="time-text">{{ formatTime(row.start_time) }}</span>
              <span class="time-sep">~</span>
              <span class="time-text">{{ formatTime(row.end_time) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <div class="status-badge" :class="row.status === 1 ? 'status-active' : 'status-disabled'">
              <span class="status-dot"></span>
              {{ row.status === 1 ? '启用' : '停用' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
              <el-button class="action-btn" type="primary" plain round size="small">
                操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit" icon="Edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="records" icon="Document">领取记录</el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status === 1"
                    command="disable"
                    icon="CircleClose"
                    divided
                  >停用</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <span class="pagination-info">
          共 <b>{{ total }}</b> 张优惠券
        </span>
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next"
          :total="total"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '创建优惠券' : '编辑优惠券'"
      width="600px"
      class="modern-dialog"
      destroy-on-close
    >
      <el-scrollbar max-height="calc(80vh - 160px)">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="coupon-form"
        >
          <el-form-item label="优惠券名称" prop="name">
            <el-input v-model="form.name" placeholder="如：满50减10" maxlength="100" show-word-limit />
          </el-form-item>

          <el-form-item label="优惠券类型" prop="type">
            <el-radio-group v-model="form.type" @change="onTypeChange">
              <el-radio-button :value="1">满减券</el-radio-button>
              <el-radio-button :value="2">折扣券</el-radio-button>
              <el-radio-button :value="3">固定金额券</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <div class="form-row">
            <el-form-item :label="form.type === 2 ? '折扣比例' : '减免金额'" prop="value" class="form-item-half">
              <el-input-number
                v-model="form.value"
                :min="form.type === 2 ? 0.01 : 0.01"
                :max="form.type === 2 ? 0.99 : 99999"
                :precision="form.type === 2 ? 2 : 2"
                :step="form.type === 2 ? 0.05 : 1"
                controls-position="right"
                style="width: 100%"
              />
              <span class="form-tip" v-if="form.type === 2">输入0.85表示85折</span>
            </el-form-item>
            <el-form-item label="最低消费" prop="min_spend" class="form-item-half">
              <el-input-number
                v-model="form.min_spend"
                :min="0"
                :precision="2"
                :step="10"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </div>

          <el-form-item v-if="form.type === 2" label="最大优惠" prop="max_discount">
            <el-input-number
              v-model="form.max_discount"
              :min="0"
              :precision="2"
              :step="10"
              controls-position="right"
              style="width: 100%"
            />
            <span class="form-tip">0 或留空表示不封顶</span>
          </el-form-item>

          <el-form-item label="适用门店" prop="store_id">
            <el-select
              v-model="form.store_id"
              placeholder="不选则为平台通用券"
              clearable
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="s in storeList"
                :key="s.id"
                :label="s.name"
                :value="s.id"
              />
            </el-select>
            <span class="form-tip">留空表示平台通用券，所有门店可用</span>
          </el-form-item>

          <div class="form-row">
            <el-form-item label="发放数量" prop="total_count" class="form-item-half">
              <el-input-number
                v-model="form.total_count"
                :min="-1"
                :step="100"
                controls-position="right"
                style="width: 100%"
              />
              <span class="form-tip">-1 表示不限量</span>
            </el-form-item>
            <el-form-item label="每人限领" prop="per_user_limit" class="form-item-half">
              <el-input-number
                v-model="form.per_user_limit"
                :min="1"
                :max="99"
                controls-position="right"
                style="width: 100%"
              />
              <span class="form-tip">&nbsp;</span>
            </el-form-item>
          </div>

          <el-form-item label="有效期" prop="timeRange" class="form-item-full">
            <el-date-picker
              v-model="form.timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </el-scrollbar>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" round>取 消</el-button>
          <el-button type="primary" :loading="submitting" round @click="submitForm">
            {{ dialogType === 'create' ? '创建优惠券' : '保存修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 领取记录弹窗 -->
    <el-dialog
      v-model="recordsVisible"
      title="领取记录"
      width="700px"
      class="modern-dialog"
      destroy-on-close
    >
      <el-table
        v-loading="recordsLoading"
        :data="recordsList"
        :header-cell-style="{ background: 'var(--el-fill-color-lighter)', color: 'var(--el-text-color-primary)', fontWeight: 600, fontSize: '13px' }"
        :row-style="{ height: '56px' }"
        style="width: 100%"
      >
        <el-table-column label="用户" min-width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="28" :src="formatAvatar(row.user?.avatar)">
                {{ (row.user?.nick_name || '?')[0] }}
              </el-avatar>
              <span class="user-name">{{ row.user?.nick_name || row.user?.user_name || '未知用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'info' : row.status === 1 ? 'success' : 'warning'" effect="dark" round size="small">
              {{ row.status === 0 ? '未使用' : row.status === 1 ? '已使用' : '已过期' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="领取时间" width="170" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ formatTime(row.claimed_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="使用时间" width="170" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ row.used_at ? formatTime(row.used_at) : '-' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container" style="margin-top: 16px">
        <span class="pagination-info">
          共 <b>{{ recordsTotal }}</b> 条记录
        </span>
        <el-pagination
          v-model:current-page="recordsQuery.pageNum"
          v-model:page-size="recordsQuery.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          :total="recordsTotal"
          background
          @size-change="fetchRecords"
          @current-change="fetchRecords"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getCouponTemplateList,
  getCouponTemplateDetail,
  createCouponTemplate,
  updateCouponTemplate,
  deleteCouponTemplate,
  getCouponRecords
} from '../../api/coupon'
import { getStoreAllList } from '../../api/store'
import { baseURL } from '../../utils/request'
import dayjs from 'dayjs'

// ---- 状态 ----
const list = ref([])
const loading = ref(false)
const total = ref(0)
const storeList = ref([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  type: '',
  status: ''
})

// ---- 统计 ----
const activeCount = computed(() => list.value.filter(c => c.status === 1).length)
const totalClaimed = computed(() => list.value.reduce((sum, c) => sum + (c.claimed_count || 0), 0))
const totalUsed = computed(() => {
  // 从列表中无法直接获取已使用数量，显示为 '-'
  return '-'
})

// ---- 弹窗 ----
const dialogVisible = ref(false)
const dialogType = ref('create')
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  type: 1,
  value: 10,
  min_spend: 0,
  max_discount: 0,
  store_id: '',
  total_count: 100,
  per_user_limit: 1,
  timeRange: []
})

const rules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择优惠券类型', trigger: 'change' }],
  value: [{ required: true, message: '请输入面值', trigger: 'blur' }],
  total_count: [{ required: true, message: '请输入发放数量', trigger: 'blur' }],
  timeRange: [{ required: true, type: 'array', message: '请选择有效期', trigger: 'change' }]
}

// ---- 领取记录弹窗 ----
const recordsVisible = ref(false)
const recordsLoading = ref(false)
const recordsList = ref([])
const recordsTotal = ref(0)
const currentTemplateId = ref(null)
const recordsQuery = reactive({ pageNum: 1, pageSize: 10 })

// ---- 工具方法 ----
const formatTime = (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'

const formatAvatar = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return baseURL + url
}

const getTypeName = (type) => {
  const map = { 1: '满减券', 2: '折扣券', 3: '固定金额券' }
  return map[type] || '未知'
}

const getTypeTagType = (type) => {
  const map = { 1: 'danger', 2: 'warning', 3: 'primary' }
  return map[type] || 'info'
}

const getTypeGradient = (type) => {
  const map = {
    1: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    2: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)',
    3: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
  return map[type] || map[1]
}

const formatCouponDesc = (row) => {
  if (row.type === 1) return `满${row.min_spend}减${row.value}`
  if (row.type === 2) {
    const discount = (row.value * 10).toFixed(row.value * 10 % 1 === 0 ? 0 : 1)
    return `${discount}折${row.max_discount ? ' (最多减' + row.max_discount + '元)' : ''}`
  }
  if (row.type === 3) return `立减${row.value}元`
  return ''
}

const formatValue = (row) => {
  if (row.type === 2) {
    const discount = (row.value * 10).toFixed(row.value * 10 % 1 === 0 ? 0 : 1)
    return discount + '折'
  }
  return '¥' + Number(row.value).toFixed(2)
}

// ---- 数据获取 ----
const fetchList = async () => {
  loading.value = true
  try {
    const params = { ...queryParams }
    if (params.type === '') delete params.type
    if (params.status === '') delete params.status
    const res = await getCouponTemplateList(params)
    list.value = res.result.list || []
    total.value = res.result.total || 0
  } catch (error) {
    console.error('获取优惠券列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchStores = async () => {
  try {
    const res = await getStoreAllList()
    storeList.value = res.result?.list || res.result || []
  } catch (error) {
    console.error('获取门店列表失败:', error)
  }
}

const handleSearch = () => {
  queryParams.pageNum = 1
  fetchList()
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  fetchList()
}

const handleCurrentChange = (val) => {
  queryParams.pageNum = val
  fetchList()
}

// ---- 操作 ----
const handleCommand = (cmd, row) => {
  if (cmd === 'edit') handleEdit(row)
  else if (cmd === 'disable') handleDisable(row)
  else if (cmd === 'records') handleRecords(row)
}

const resetForm = () => {
  form.id = null
  form.name = ''
  form.type = 1
  form.value = 10
  form.min_spend = 0
  form.max_discount = 0
  form.store_id = ''
  form.total_count = 100
  form.per_user_limit = 1
  form.timeRange = []
}

const handleCreate = () => {
  dialogType.value = 'create'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  dialogType.value = 'edit'
  resetForm()
  try {
    const res = await getCouponTemplateDetail(row.id)
    const data = res.result
    form.id = data.id
    form.name = data.name
    form.type = data.type
    form.value = Number(data.value)
    form.min_spend = Number(data.min_spend || 0)
    form.max_discount = Number(data.max_discount || 0)
    form.store_id = data.store_id || ''
    form.total_count = data.total_count
    form.per_user_limit = data.per_user_limit || 1
    form.timeRange = [
      dayjs(data.start_time).format('YYYY-MM-DD HH:mm:ss'),
      dayjs(data.end_time).format('YYYY-MM-DD HH:mm:ss')
    ]
    dialogVisible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
  }
}

const handleDisable = (row) => {
  ElMessageBox.confirm(`确定要停用优惠券「${row.name}」吗？停用后用户将无法领取。`, '确认停用', {
    confirmButtonText: '确认停用',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    try {
      await deleteCouponTemplate(row.id)
      ElMessage.success('优惠券已停用')
      fetchList()
    } catch (error) {
      console.error('停用失败:', error)
    }
  }).catch(() => {})
}

const onTypeChange = () => {
  if (form.type === 2) {
    form.value = 0.85
    form.min_spend = 0
  } else if (form.type === 1) {
    form.value = 10
    form.min_spend = 50
  } else {
    form.value = 5
    form.min_spend = 0
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    if (!form.timeRange || form.timeRange.length !== 2) {
      ElMessage.warning('请选择有效期')
      return
    }

    // 满减券校验
    if (form.type === 1 && (!form.min_spend || form.min_spend <= 0)) {
      ElMessage.warning('满减券必须设置最低消费金额')
      return
    }

    submitting.value = true
    try {
      const payload = {
        name: form.name,
        type: form.type,
        value: form.value,
        min_spend: form.min_spend,
        total_count: form.total_count,
        per_user_limit: form.per_user_limit,
        start_time: form.timeRange[0],
        end_time: form.timeRange[1]
      }
      // 可选字段：有值才传，避免 null 触发后端类型校验
      if (form.type === 2 && form.max_discount) payload.max_discount = form.max_discount
      if (form.store_id) payload.store_id = form.store_id

      if (dialogType.value === 'create') {
        await createCouponTemplate(payload)
        ElMessage.success('优惠券创建成功')
      } else {
        await updateCouponTemplate(form.id, payload)
        ElMessage.success('优惠券更新成功')
      }
      dialogVisible.value = false
      fetchList()
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      submitting.value = false
    }
  })
}

// ---- 领取记录 ----
const handleRecords = async (row) => {
  currentTemplateId.value = row.id
  recordsQuery.pageNum = 1
  recordsVisible.value = true
  fetchRecords()
}

const fetchRecords = async () => {
  if (!currentTemplateId.value) return
  recordsLoading.value = true
  try {
    const res = await getCouponRecords(currentTemplateId.value, recordsQuery)
    recordsList.value = res.result.list || []
    recordsTotal.value = res.result.total || 0
  } catch (error) {
    console.error('获取记录失败:', error)
  } finally {
    recordsLoading.value = false
  }
}

onMounted(() => {
  fetchList()
  fetchStores()
})
</script>

<style scoped>
.coupon-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---- 统计卡片 ---- */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s;
}
.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.stat-info {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

/* ---- 主卡片 ---- */
.table-card {
  flex: 1;
  border-radius: 12px;
  border: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.table-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
}

/* ---- 工具栏 ---- */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.filter-select {
  width: 130px;
}
.filter-select :deep(.el-input__wrapper) {
  border-radius: 8px;
}

/* ---- 表格 ---- */
.coupon-table {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
}
.coupon-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.coupon-table :deep(.el-table__header th) {
  border-bottom: none !important;
}
.coupon-table :deep(.el-table__row:hover > td) {
  background-color: var(--el-fill-color-lighter) !important;
}

/* ---- 优惠券信息单元格 ---- */
.coupon-info-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}
.coupon-type-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.coupon-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}
.coupon-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.coupon-desc {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* ---- 面值 ---- */
.value-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-color-danger);
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
}

/* ---- 门槛 ---- */
.spend-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

/* ---- 发放/领取 ---- */
.count-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.count-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.count-progress {
  width: 80%;
  margin: 0 auto;
}

/* ---- 有效期 ---- */
.time-range {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.time-text {
  color: var(--el-text-color-secondary);
}
.time-sep {
  color: var(--el-text-color-placeholder);
}

/* ---- 状态徽章 ---- */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-active {
  background: rgba(0, 184, 148, 0.1);
  color: #00b894;
}
.status-active .status-dot {
  background: #00b894;
  box-shadow: 0 0 6px rgba(0, 184, 148, 0.4);
}
.status-disabled {
  background: rgba(178, 190, 195, 0.15);
  color: #636e72;
}
.status-disabled .status-dot {
  background: #b2bec3;
}

/* ---- 通用 ---- */
.empty-text {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
.time-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.action-btn {
  font-weight: 500;
}
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
  display: block;
}

/* ---- 用户单元格 ---- */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-name {
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 分页 ---- */
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-info {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pagination-info b {
  color: var(--el-color-primary);
}

/* ---- 弹窗 ---- */
.modern-dialog :deep(.el-dialog) {
  border-radius: 16px;
}
.modern-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.modern-dialog :deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
}
.modern-dialog :deep(.el-dialog__body) {
  padding: 24px;
}
.modern-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ---- 表单 ---- */
.coupon-form {
  padding: 0 4px;
}
.coupon-form :deep(.el-form-item) {
  margin-bottom: 22px;
}
.coupon-form :deep(.el-form-item__label) {
  padding-bottom: 6px;
  font-weight: 500;
}
.coupon-form :deep(.el-input__wrapper),
.coupon-form :deep(.el-textarea__inner) {
  border-radius: 8px;
}
.coupon-form :deep(.el-input-number) {
  width: 100%;
}
.form-row {
  display: flex;
  gap: 16px;
}
.form-item-half {
  flex: 1;
}

/* ---- 暗色模式 ---- */
.dark .stat-card {
  background: var(--el-bg-color-overlay);
}
</style>
