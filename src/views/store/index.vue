<template>
  <div class="store-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="title">门店管理</span>
          <el-button type="primary" icon="Plus" @click="handleCreate">新增门店</el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="storeList"
        border
        stripe
        height="calc(100vh - 300px)"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="门店名称" min-width="150" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="营业时间" min-width="200">
          <template #default="scope">
            <div v-for="item in parseBusinessHours(scope.row.business_hours)" :key="item" class="time-tag">
              <el-tag size="small" type="info" effect="plain" class="mr-1">{{ item }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="当前状态" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getStoreStatus(scope.row.business_hours).type" effect="dark">
              {{ getStoreStatus(scope.row.business_hours).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
          <template #default="scope">
            {{ formatTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button type="danger" link icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增门店' : '编辑门店'"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="storeFormRef"
        :model="storeForm"
        :rules="rules"
        label-width="100px"
        style="padding: 10px 20px"
      >
        <el-form-item label="门店名称" prop="name">
          <el-input v-model="storeForm.name" placeholder="请输入门店名称" />
        </el-form-item>
        
        <el-form-item label="营业时间" required>
          <div v-for="(time, index) in storeForm.business_hours_list" :key="index" class="time-range-item">
            <el-time-picker
              v-model="storeForm.business_hours_list[index]"
              is-range
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 300px"
            />
            <el-button 
              v-if="storeForm.business_hours_list.length > 1" 
              type="danger" 
              link 
              icon="Delete" 
              class="ml-2"
              @click="removeTimeRange(index)"
            />
          </div>
          <el-button type="primary" link icon="Plus" @click="addTimeRange" class="mt-2">添加时间段</el-button>
        </el-form-item>

        <el-form-item label="门店地址" prop="address">
          <el-input v-model="storeForm.address" placeholder="请输入门店地址" />
        </el-form-item>
        <el-form-item label="门店描述" prop="description">
          <el-input v-model="storeForm.description" type="textarea" :rows="3" placeholder="请输入门店描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStoreList, createStore, updateStore, deleteStore } from '../../api/store'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(isBetween)
dayjs.extend(customParseFormat)

const storeList = ref([])
const loading = ref(false)
const total = ref(0)
const dialogVisible = ref(false)
const dialogType = ref('create')
const submitting = ref(false)
const storeFormRef = ref(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 20
})

const storeForm = reactive({
  id: null,
  name: '',
  description: '',
  address: '',
  business_hours_list: [['08:00', '22:00']]
})

const rules = {
  name: [
    { required: true, message: '请输入门店名称', trigger: 'blur' }
  ]
}

const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const parseBusinessHours = (str) => {
  if (!str) return []
  try {
    return JSON.parse(str)
  } catch (e) {
    return [str]
  }
}

const getStoreStatus = (business_hours_str) => {
  const ranges = parseBusinessHours(business_hours_str)
  if (ranges.length === 0) return { text: '休息中', type: 'info' }
  
  const now = dayjs()
  const currentTime = now.format('HH:mm')
  
  const isOpen = ranges.some(range => {
    const [start, end] = range.split('-')
    if (start <= end) {
      return currentTime >= start && currentTime <= end
    } else {
      return currentTime >= start || currentTime <= end
    }
  })
  
  return isOpen ? { text: '营业中', type: 'success' } : { text: '休息中', type: 'info' }
}

const fetchStores = async () => {
  loading.value = true
  try {
    const res = await getStoreList(queryParams)
    storeList.value = res.result.list || []
    total.value = res.result.total || 0
  } catch (error) {
    console.error('获取门店失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  fetchStores()
}

const handleCurrentChange = (val) => {
  queryParams.pageNum = val
  fetchStores()
}

const addTimeRange = () => {
  storeForm.business_hours_list.push(['08:00', '22:00'])
}

const removeTimeRange = (index) => {
  storeForm.business_hours_list.splice(index, 1)
}

const handleCreate = () => {
  dialogType.value = 'create'
  storeForm.id = null
  storeForm.name = ''
  storeForm.description = ''
  storeForm.address = ''
  storeForm.business_hours_list = [['08:00', '22:00']]
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  storeForm.id = row.id
  storeForm.name = row.name
  storeForm.description = row.description
  storeForm.address = row.address
  
  const ranges = parseBusinessHours(row.business_hours)
  storeForm.business_hours_list = ranges.map(r => r.split('-'))
  if (storeForm.business_hours_list.length === 0) {
    storeForm.business_hours_list = [['08:00', '22:00']]
  }
  
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!storeFormRef.value) return
  await storeFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const businessHours = storeForm.business_hours_list
          .filter(range => range && range.length === 2)
          .map(range => `${range[0]}-${range[1]}`)
        
        const payload = {
          name: storeForm.name,
          description: storeForm.description,
          address: storeForm.address,
          business_hours: JSON.stringify(businessHours)
        }
        
        if (dialogType.value === 'create') {
          await createStore(payload)
          ElMessage.success('新增门店成功')
        } else {
          await updateStore(storeForm.id, payload)
          ElMessage.success('修改门店成功')
        }
        dialogVisible.value = false
        fetchStores()
      } catch (error) {
        console.error('保存失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该门店吗?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteStore(row.id)
      ElMessage.success('删除门店成功')
      fetchStores()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchStores()
})
</script>

<style scoped>
.store-container { padding: 24px; background-color: var(--el-bg-color-page); min-height: 100%; display: flex; flex-direction: column; }
.table-card { border-radius: 8px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex: 1; display: flex; flex-direction: column; }
.table-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-header .title { font-size: 18px; font-weight: 600; }
.time-range-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.ml-2 { margin-left: 8px; }
.mt-2 { margin-top: 8px; }
.mr-1 { margin-right: 4px; }
.time-tag { display: inline-block; margin-bottom: 4px; }
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
