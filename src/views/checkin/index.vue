<template>
  <div class="checkin-container">
    <!-- 签到奖励配置 -->
    <el-card class="reward-config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="card-header-left">
            <el-icon size="18" color="var(--el-color-primary)"><Calendar /></el-icon>
            <span class="card-title">签到奖励配置</span>
            <el-tag type="info" effect="plain" size="small" round>7天轮换</el-tag>
          </div>
          <el-button type="primary" round :loading="saving" @click="handleSave">
            <el-icon><Check /></el-icon>保存配置
          </el-button>
        </div>
      </template>

      <div v-loading="configLoading" class="reward-grid">
        <div
          v-for="day in rewardConfig"
          :key="day.day_number"
          class="reward-day-card"
        >
          <div class="day-header">
            <div class="day-number" :style="{ background: getDayGradient(day.day_number) }">
              {{ day.day_number }}
            </div>
            <span class="day-label">第 {{ day.day_number }} 天</span>
          </div>
          <div class="day-body">
            <el-select
              v-model="day.template_id"
              placeholder="选择优惠券模板"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="t in templateList"
                :key="t.id"
                :label="t.name"
                :value="t.id"
              >
                <div class="template-option">
                  <span class="template-name">{{ t.name }}</span>
                  <span class="template-desc">{{ formatTemplateDesc(t) }}</span>
                </div>
              </el-option>
            </el-select>
            <div v-if="day.template" class="day-preview">
              <span class="preview-value">{{ formatTemplateValue(day.template) }}</span>
              <span class="preview-name">{{ day.template?.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 签到记录表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="card-header-left">
            <el-icon size="18" color="var(--el-color-primary)"><Document /></el-icon>
            <span class="card-title">签到记录</span>
          </div>
          <div class="card-header-right">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              size="default"
              style="width: 280px"
              @change="handleDateChange"
            />
          </div>
        </div>
      </template>

      <el-table
        v-loading="recordsLoading"
        :data="recordsList"
        :header-cell-style="{ background: 'var(--el-fill-color-lighter)', color: 'var(--el-text-color-primary)', fontWeight: 600, fontSize: '13px' }"
        :row-style="{ height: '60px' }"
        class="records-table"
        height="calc(100vh - 580px)"
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

        <el-table-column label="签到日期" width="130" align="center">
          <template #default="{ row }">
            <span class="date-text">{{ row.checkin_date }}</span>
          </template>
        </el-table-column>

        <el-table-column label="第几天" width="100" align="center">
          <template #default="{ row }">
            <div class="day-badge" :style="{ background: getDayGradient(row.day_number) }">
              第{{ row.day_number }}天
            </div>
          </template>
        </el-table-column>

        <el-table-column label="连续签到" width="110" align="center">
          <template #default="{ row }">
            <span class="streak-text">{{ row.streak }} 天</span>
          </template>
        </el-table-column>

        <el-table-column label="奖励优惠券" min-width="200">
          <template #default="{ row }">
            <div v-if="row.coupon?.template" class="coupon-cell">
              <el-tag :type="getCouponTagType(row.coupon.template.type)" effect="dark" round size="small">
                {{ getCouponTypeName(row.coupon.template.type) }}
              </el-tag>
              <span class="coupon-name">{{ row.coupon.template.name }}</span>
            </div>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="签到时间" width="170" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <span class="pagination-info">
          共 <b>{{ recordsTotal }}</b> 条签到记录
        </span>
        <el-pagination
          v-model:current-page="recordsQuery.pageNum"
          v-model:page-size="recordsQuery.pageSize"
          :page-sizes="[20, 50, 100]"
          layout="sizes, prev, pager, next"
          :total="recordsTotal"
          background
          @size-change="fetchRecords"
          @current-change="fetchRecords"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getCheckinRewards, updateCheckinRewards, getCheckinRecords } from '../../api/checkin'
import { getCouponTemplateList } from '../../api/coupon'
import { baseURL } from '../../utils/request'
import dayjs from 'dayjs'

// ---- 奖励配置 ----
const configLoading = ref(false)
const saving = ref(false)
const rewardConfig = ref([])
const templateList = ref([])

const dayGradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
]

const getDayGradient = (day) => dayGradients[(day - 1) % 7]

const formatTemplateDesc = (t) => {
  if (t.type === 1) return `满${t.min_spend}减${t.value}`
  if (t.type === 2) return `${(t.value * 10).toFixed(0)}折`
  if (t.type === 3) return `立减${t.value}元`
  return ''
}

const formatTemplateValue = (t) => {
  if (!t) return ''
  if (t.type === 2) return `${(t.value * 10).toFixed(0)}折`
  return `¥${Number(t.value).toFixed(2)}`
}

const fetchConfig = async () => {
  configLoading.value = true
  try {
    const res = await getCheckinRewards()
    const rewards = res.result || []
    // 填充7天配置，如果后端返回不足7天则补齐
    const config = []
    for (let i = 1; i <= 7; i++) {
      const existing = rewards.find(r => r.day_number === i)
      config.push({
        day_number: i,
        template_id: existing?.template_id || '',
        template: existing?.coupon_template || existing?.template || null,
      })
    }
    rewardConfig.value = config
  } catch (error) {
    console.error('获取签到配置失败:', error)
  } finally {
    configLoading.value = false
  }
}

const fetchTemplates = async () => {
  try {
    const res = await getCouponTemplateList({ status: 1, pageNum: 1, pageSize: 999 })
    templateList.value = res.result?.list || []
  } catch (error) {
    console.error('获取优惠券模板失败:', error)
  }
}

const handleSave = async () => {
  // 校验所有天都选择了模板
  const missing = rewardConfig.value.filter(d => !d.template_id)
  if (missing.length > 0) {
    ElMessage.warning(`请为第 ${missing.map(d => d.day_number).join('、')} 天选择奖励优惠券`)
    return
  }

  saving.value = true
  try {
    const rewards = rewardConfig.value.map(d => ({
      day_number: d.day_number,
      template_id: d.template_id,
    }))
    await updateCheckinRewards({ rewards })
    ElMessage.success('签到奖励配置已保存')
    fetchConfig()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

// ---- 签到记录 ----
const recordsLoading = ref(false)
const recordsList = ref([])
const recordsTotal = ref(0)
const dateRange = ref([])

const recordsQuery = reactive({
  pageNum: 1,
  pageSize: 20,
})

const fetchRecords = async () => {
  recordsLoading.value = true
  try {
    const params = { ...recordsQuery }
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    const res = await getCheckinRecords(params)
    recordsList.value = res.result?.list || []
    recordsTotal.value = res.result?.total || 0
  } catch (error) {
    console.error('获取签到记录失败:', error)
  } finally {
    recordsLoading.value = false
  }
}

const handleDateChange = () => {
  recordsQuery.pageNum = 1
  fetchRecords()
}

// ---- 工具方法 ----
const formatTime = (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'

const formatAvatar = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return baseURL + url
}

const getCouponTypeName = (type) => {
  const map = { 1: '满减券', 2: '折扣券', 3: '固定金额券' }
  return map[type] || '未知'
}

const getCouponTagType = (type) => {
  const map = { 1: 'danger', 2: 'warning', 3: 'primary' }
  return map[type] || 'info'
}

onMounted(() => {
  fetchConfig()
  fetchTemplates()
  fetchRecords()
})
</script>

<style scoped>
.checkin-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---- 卡片头部 ---- */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* ---- 奖励配置卡片 ---- */
.reward-config-card {
  border-radius: 12px;
  border: none;
}
.reward-config-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.reward-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  padding: 4px 0;
}

.reward-day-card {
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 16px 12px;
  transition: box-shadow 0.3s, border-color 0.3s;
}
.reward-day-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border-color: var(--el-color-primary-light-5);
}

.day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.day-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.day-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.day-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.day-body :deep(.el-select) {
  width: 100% !important;
}
.day-body :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.day-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0 0;
}
.preview-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-color-danger);
}
.preview-name {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.template-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.template-name {
  font-weight: 500;
}
.template-desc {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* ---- 记录表格卡片 ---- */
.table-card {
  flex: 1;
  border-radius: 12px;
  border: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.table-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.table-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
}

.records-table {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
}
.records-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

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

.date-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
}

.day-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  border-radius: 12px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.streak-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-warning);
}

.coupon-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.coupon-name {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.empty-text {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
.time-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
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

/* ---- 暗色模式 ---- */
.dark .reward-day-card {
  background: var(--el-bg-color-overlay);
}
</style>
