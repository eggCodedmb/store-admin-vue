<template>
  <div class="notice-manage-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="left">
            <el-select
              v-model="queryParams.store_id"
              placeholder="发布门店"
              style="width: 180px; margin-right: 12px"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="item in storeOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
            <el-input
              v-model="queryParams.title"
              placeholder="搜索公告标题"
              style="width: 250px"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
            <el-button type="primary" style="margin-left: 12px" @click="handleSearch">查询</el-button>
          </div>
          <div class="right">
            <el-button type="primary" icon="Plus" @click="handleCreate">发布公告</el-button>
          </div>
        </div>
      </template>

      <div class="table-wrapper">
        <el-table v-loading="loading" :data="noticeList" border stripe height="100%">
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="store_id" label="发布门店" width="150" align="center">
            <template #default="scope">
              {{ getStoreName(scope.row.store_id) }}
            </template>
          </el-table-column>
          <el-table-column prop="title" label="公告标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getTypeTag(scope.row.type)">{{ getTypeName(scope.row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.status ? 'success' : 'info'">{{ scope.row.status ? '已发布' : '隐藏' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="icon" label="图标" width="100" align="center">
            <template #default="scope">
              <el-icon v-if="scope.row.icon" size="20">
                <component :is="scope.row.icon" />
              </el-icon>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="author" label="发布人" width="120" align="center" />
          <el-table-column prop="createdAt" label="发布时间" width="180" align="center">
            <template #default="scope">
              {{ formatTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template #default="scope">
              <el-button size="small" type="primary" link icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" link icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="fetchNotices"
          @current-change="fetchNotices"
        />
      </div>
    </el-card>

    <!-- 发布/编辑公告弹窗 -->
    <el-dialog :title="dialogType === 'create' ? '发布公告' : '编辑公告'" v-model="dialogVisible" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="发布门店" prop="store_id">
          <el-select v-model="form.store_id" placeholder="请选择发布门店" style="width: 100%">
            <el-option label="全部门店" :value="0" />
            <el-option
              v-for="item in storeOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="通知" :value="1" />
            <el-option label="公告" :value="2" />
            <el-option label="活动" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" active-text="发布" inactive-text="隐藏" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-select v-model="form.icon" placeholder="请选择图标" style="width: 100%" clearable>
            <el-option
              v-for="icon in iconOptions"
              :key="icon"
              :label="icon"
              :value="icon"
            >
              <div style="display: flex; align-items: center">
                <el-icon style="margin-right: 8px"><component :is="icon" /></el-icon>
                <span>{{ icon }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input type="textarea" v-model="form.content" :rows="6" placeholder="请输入公告内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
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

const fetchNotices = async () => {
  loading.value = true
  try {
    const res = await getNoticeList(queryParams)
    noticeList.value = res.result.list
    total.value = res.result.total
  } catch (error) {
    console.error('Failed to fetch notices:', error)
  } finally {
    loading.value = false
  }
}

const fetchIcons = async () => {
  try {
    const res = await getNoticeIcons()
    iconOptions.value = res.result
  } catch (error) {
    console.error('Failed to fetch icons:', error)
  }
}

const fetchStores = async () => {
  try {
    const res = await getStoreList({ pageNum: 1, pageSize: 100 })
    storeOptions.value = res.result.list
  } catch (error) {
    console.error('Failed to fetch stores:', error)
  }
}

const handleSearch = () => {
  queryParams.pageNum = 1
  fetchNotices()
}

const getTypeName = (type) => {
  const map = { 1: '通知', 2: '公告', 3: '活动' }
  return map[type] || '未知'
}

const getStoreName = (store_id) => {
  const store = storeOptions.value.find(s => s.id === store_id)
  return store ? store.name : '全部门店'
}

const getTypeTag = (type) => {
  const map = { 1: 'primary', 2: 'warning', 3: 'danger' }
  return map[type] || ''
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const handleCreate = () => {
  dialogType.value = 'create'
  Object.assign(form, { id: null, title: '', content: '', type: 1, status: true, author: userStore.userInfo?.user_name || 'Admin', icon: '', store_id: queryParams.store_id })
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
          ElMessage.success('发布公告成功')
        } else {
          await updateNotice(form.id, form)
          ElMessage.success('更新公告成功')
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
  ElMessageBox.confirm(`确定要删除公告 "${row.title}" 吗？`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteNotice(row.id)
    ElMessage.success('删除成功')
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
.notice-manage-container {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.table-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
}
.table-wrapper {
  flex: 1;
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
