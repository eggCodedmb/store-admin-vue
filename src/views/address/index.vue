<template>
  <div class="address-container">
    <!-- 顶部统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <el-icon size="24"><Location /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ total }}</span>
          <span class="stat-label">地址总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%)">
          <el-icon size="24"><Star /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ defaultCount }}</span>
          <span class="stat-label">默认地址</span>
        </div>
      </div>
    </div>

    <!-- 主表格卡片 -->
    <el-card class="table-card" shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-input
          v-model="queryParams.consignee"
          placeholder="搜索收货人姓名"
          prefix-icon="Search"
          clearable
          class="search-input"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" round icon="Search" @click="handleSearch">搜索</el-button>
      </div>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="addressList"
        :header-cell-style="{ background: 'var(--el-fill-color-lighter)', color: 'var(--el-text-color-primary)', fontWeight: 600, fontSize: '13px' }"
        :row-style="{ height: '72px' }"
        class="address-table"
        height="calc(100vh - 420px)"
        style="width: 100%"
      >
        <el-table-column label="收货人" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="36" :style="{ background: getAvatarColor(row.consignee), flexShrink: 0 }">
                {{ (row.consignee || '').slice(0, 1) }}
              </el-avatar>
              <div class="user-detail">
                <span class="user-name">{{ row.consignee }}</span>
                <span class="user-id">ID: {{ row.id }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="联系电话" width="160">
          <template #default="{ row }">
            <span v-if="row.phone" class="phone-text">
              <el-icon size="13"><Phone /></el-icon>
              {{ row.phone }}
            </span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="详细地址" min-width="300">
          <template #default="{ row }">
            <div class="address-cell">
              <el-icon class="address-icon" size="14"><Location /></el-icon>
              <span class="address-text">{{ row.address }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <div class="status-badge" :class="row.is_default ? 'status-default' : 'status-normal'">
              <el-icon v-if="row.is_default" size="12"><Star /></el-icon>
              <span class="status-dot" v-else></span>
              {{ row.is_default ? '默认' : '普通' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="170" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              class="delete-btn"
              type="danger"
              plain
              round
              size="small"
              icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <span class="pagination-info">
          共 <b>{{ total }}</b> 条记录
        </span>
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          :total="total"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getAddressList, deleteAddress } from '../../api/address'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const addressList = ref([])
const total = ref(0)
const loading = ref(false)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  consignee: ''
})

// 统计
const defaultCount = computed(() => addressList.value.filter(a => a.is_default).length)

// 头像颜色
const avatarColors = ['#667eea', '#f5576c', '#00b894', '#fdcb6e', '#e17055', '#0984e3', '#6c5ce7', '#00cec9']
const getAvatarColor = (name) => {
  if (!name) return avatarColors[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const fetchAddresses = async () => {
  loading.value = true
  try {
    const res = await getAddressList(queryParams)
    addressList.value = res.result.list
    total.value = res.result.total
  } catch (error) {
    console.error('获取地址列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.pageNum = 1
  fetchAddresses()
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.pageNum = 1
  fetchAddresses()
}

const handleCurrentChange = (val) => {
  queryParams.pageNum = val
  fetchAddresses()
}

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除收货人「${row.consignee}」的地址吗？删除后将无法恢复。`,
    '确认删除',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    try {
      await deleteAddress(row.id)
      ElMessage.success('地址已删除')
      fetchAddresses()
    } catch (error) {
      console.error(error)
    }
  })
}

onMounted(fetchAddresses)
</script>

<style scoped>
.address-container {
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
  grid-template-columns: repeat(2, 1fr);
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
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.search-input {
  width: 260px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

/* ---- 表格 ---- */
.address-table {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
}
.address-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.address-table :deep(.el-table__header th) {
  border-bottom: none !important;
}
.address-table :deep(.el-table__row:hover > td) {
  background-color: var(--el-fill-color-lighter) !important;
}

/* ---- 收货人单元格 ---- */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}
.user-id {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* ---- 电话 ---- */
.phone-text {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

/* ---- 地址 ---- */
.address-cell {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.address-icon {
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
  flex-shrink: 0;
}
.address-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

/* ---- 状态徽章 ---- */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
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
.status-default {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}
.status-default .el-icon {
  color: #667eea;
}
.status-normal {
  background: rgba(178, 190, 195, 0.15);
  color: #636e72;
}
.status-normal .status-dot {
  background: #b2bec3;
}

/* ---- 时间 ---- */
.time-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ---- 空状态 ---- */
.empty-text {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

/* ---- 删除按钮 ---- */
.delete-btn {
  font-weight: 500;
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
.dark .stat-card {
  background: var(--el-bg-color-overlay);
}
</style>
