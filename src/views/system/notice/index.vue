<template>
  <div class="notice-container">
    <!-- 顶部统计 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <el-icon size="24"><Bell /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ total }}</span>
          <span class="stat-label">公告总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%)">
          <el-icon size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ publishedCount }}</span>
          <span class="stat-label">已发布</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%)">
          <el-icon size="24"><Hide /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ hiddenCount }}</span>
          <span class="stat-label">已隐藏</span>
        </div>
      </div>
    </div>

    <!-- 主卡片 -->
    <el-card class="table-card" shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="queryParams.title"
            placeholder="搜索公告标题"
            prefix-icon="Search"
            clearable
            class="search-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-select v-model="queryParams.store_id" placeholder="发布门店" clearable @change="handleSearch" class="filter-select">
            <el-option label="全部门店" :value="0" />
            <el-option v-for="item in storeOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </div>
        <el-button type="primary" round icon="Plus" @click="handleCreate">发布公告</el-button>
      </div>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="noticeList"
        :header-cell-style="{ background: 'var(--el-fill-color-lighter)', color: 'var(--el-text-color-primary)', fontWeight: 600, fontSize: '13px' }"
        :row-style="{ height: '72px' }"
        class="notice-table"
        height="calc(100vh - 480px)"
        style="width: 100%"
      >
        <el-table-column label="公告信息" min-width="300">
          <template #default="{ row }">
            <div class="notice-cell">
              <div class="notice-icon-wrap" :style="{ background: getTypeGradient(row.type) }">
                <el-icon v-if="row.icon" size="18" color="#fff">
                  <component :is="row.icon" />
                </el-icon>
                <el-icon v-else size="18" color="#fff"><Bell /></el-icon>
              </div>
              <div class="notice-detail">
                <span class="notice-title">{{ row.title }}</span>
                <span class="notice-store">
                  <el-icon size="12"><OfficeBuilding /></el-icon>
                  {{ getStoreName(row.store_id) }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getTypeTag(row.type)"
              effect="dark"
              round
              size="small"
            >
              {{ getTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <div class="status-badge" :class="row.status ? 'status-on' : 'status-off'">
              <span class="status-dot"></span>
              {{ row.status ? '已发布' : '隐藏' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="author" label="发布人" width="120" align="center">
          <template #default="{ row }">
            <span class="author-text">{{ row.author || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="发布时间" width="170" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
              <el-button class="action-btn" type="primary" plain round size="small">
                操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit" icon="Edit">编辑公告</el-dropdown-item>
                  <el-dropdown-item command="delete" icon="Delete" divided>删除公告</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <span class="pagination-info">
          共 <b>{{ total }}</b> 条公告
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

    <!-- 发布/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '发布公告' : '编辑公告'"
      width="620px"
      class="modern-dialog"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" class="dialog-form">
        <el-form-item label="发布门店" prop="store_id">
          <el-select v-model="form.store_id" placeholder="请选择发布门店" style="width: 100%">
            <el-option label="全部门店" :value="0" />
            <el-option v-for="item in storeOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" prefix-icon="EditPen" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="类型" prop="type" class="form-item-half">
            <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
              <el-option label="通知" :value="1" />
              <el-option label="公告" :value="2" />
              <el-option label="活动" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" class="form-item-half">
            <el-switch
              v-model="form.status"
              active-text="发布"
              inactive-text="隐藏"
              inline-prompt
              style="--el-switch-on-color: #00b894; --el-switch-off-color: #dfe6e9"
            />
          </el-form-item>
        </div>
        <el-form-item label="图标">
          <el-select v-model="form.icon" placeholder="选择图标（可选）" style="width: 100%" clearable>
            <el-option v-for="icon in iconOptions" :key="icon" :label="icon" :value="icon">
              <div style="display: flex; align-items: center; gap: 8px">
                <el-icon><component :is="icon" /></el-icon>
                <span>{{ icon }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入公告内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" round>取 消</el-button>
          <el-button type="primary" :loading="submitting" round @click="submitForm">
            {{ dialogType === 'create' ? '发布公告' : '保存修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getNoticeList, createNotice, updateNotice, deleteNotice, getNoticeIcons } from '../../../api/notice'
import { getStoreList } from '../../../api/store'
import { useUserStore } from '../../../store/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const userStore = useUserStore()

const noticeList = ref([])
const iconOptions = ref([])
const storeOptions = ref([])
const total = ref(0)
const loading = ref(false)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  title: '',
  store_id: null
})

const dialogVisible = ref(false)
const dialogType = ref('create')
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  title: '',
  content: '',
  type: 1,
  status: true,
  author: '',
  icon: '',
  store_id: null
})

const rules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
  type: [{ required: true, message: '请选择公告类型', trigger: 'change' }],
  store_id: [{ required: true, message: '请选择发布门店', trigger: 'change' }]
}

// 统计
const publishedCount = computed(() => noticeList.value.filter(n => n.status).length)
const hiddenCount = computed(() => noticeList.value.filter(n => !n.status).length)

const fetchNotices = async () => {
  loading.value = true
  try {
    const res = await getNoticeList(queryParams)
    noticeList.value = res.result.list
    total.value = res.result.total
  } catch (error) {
    console.error('获取公告失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchIcons = async () => {
  try {
    const res = await getNoticeIcons()
    iconOptions.value = res.result
  } catch (error) {
    console.error('获取图标失败:', error)
  }
}

const fetchStores = async () => {
  try {
    const res = await getStoreList({ pageNum: 1, pageSize: 100 })
    storeOptions.value = res.result.list
  } catch (error) {
    console.error('获取门店失败:', error)
  }
}

const handleSearch = () => {
  queryParams.pageNum = 1
  fetchNotices()
}

const handleSizeChange = () => {
  queryParams.pageNum = 1
  fetchNotices()
}

const handleCurrentChange = () => {
  fetchNotices()
}

const handleCommand = (cmd, row) => {
  if (cmd === 'edit') handleEdit(row)
  else if (cmd === 'delete') handleDelete(row)
}

const getTypeName = (type) => ({ 1: '通知', 2: '公告', 3: '活动' })[type] || '未知'
const getTypeTag = (type) => ({ 1: '', 2: 'warning', 3: 'danger' })[type] || ''
const getTypeGradient = (type) => ({
  1: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  2: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)',
  3: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
})[type] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

const getStoreName = (store_id) => {
  if (!store_id) return '全部门店'
  const store = storeOptions.value.find(s => s.id === store_id)
  return store ? store.name : '全部门店'
}

const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const handleCreate = () => {
  dialogType.value = 'create'
  Object.assign(form, {
    id: null, title: '', content: '', type: 1, status: true,
    author: userStore.userInfo?.user_name || 'Admin', icon: '', store_id: queryParams.store_id
  })
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.assign(form, row)
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (dialogType.value === 'create') {
          await createNotice(form)
          ElMessage.success('公告发布成功')
        } else {
          await updateNotice(form.id, form)
          ElMessage.success('公告更新成功')
        }
        dialogVisible.value = false
        fetchNotices()
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除公告「${row.title}」吗？删除后不可恢复。`, '确认删除', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    await deleteNotice(row.id)
    ElMessage.success('公告已删除')
    fetchNotices()
  })
}

onMounted(() => {
  fetchNotices()
  fetchIcons()
  fetchStores()
})
</script>

<style scoped>
.notice-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---- 统计 ---- */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
.search-input {
  width: 240px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}
.filter-select {
  width: 160px;
}
.filter-select :deep(.el-input__wrapper) {
  border-radius: 8px;
}

/* ---- 表格 ---- */
.notice-table {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
}
.notice-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.notice-table :deep(.el-table__header th) {
  border-bottom: none !important;
}
.notice-table :deep(.el-table__row:hover > td) {
  background-color: var(--el-fill-color-lighter) !important;
}

/* ---- 公告信息单元格 ---- */
.notice-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}
.notice-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.notice-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 3px;
}
.notice-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notice-store {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  display: flex;
  align-items: center;
  gap: 3px;
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
.status-on {
  background: rgba(0, 184, 148, 0.1);
  color: #00b894;
}
.status-on .status-dot {
  background: #00b894;
  box-shadow: 0 0 6px rgba(0, 184, 148, 0.4);
}
.status-off {
  background: rgba(178, 190, 195, 0.15);
  color: #636e72;
}
.status-off .status-dot {
  background: #b2bec3;
}

/* ---- 通用 ---- */
.author-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.time-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.action-btn {
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
.dialog-form :deep(.el-input__wrapper),
.dialog-form :deep(.el-textarea__inner) {
  border-radius: 8px;
}
.dialog-form :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}
.form-row {
  display: flex;
  gap: 16px;
}
.form-item-half {
  flex: 1;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ---- 暗色模式 ---- */
.dark .stat-card {
  background: var(--el-bg-color-overlay);
}
</style>
