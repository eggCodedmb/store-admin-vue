<template>
  <div class="spec-manage-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">规格管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增公共规格
          </el-button>
        </div>
      </template>

      <el-table :data="specList" border v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="规格名称" width="180" />
        <el-table-column label="包含选项">
          <template #default="{ row }">
            <div class="tag-group">
              <el-tag 
                v-for="opt in row.spec_options" 
                :key="opt.id" 
                class="spec-tag"
                size="small"
              >
                {{ opt.name }} (+{{ opt.price_delta }}元)
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑规格模板' : '新增公共规格'"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="specForm" ref="formRef" label-position="top">
        <el-form-item label="规格名称" required>
          <el-input v-model="specForm.name" placeholder="请输入规格名称 (如: 甜度, 尺寸)" />
        </el-form-item>
        
        <div class="options-header">
          <span>规格选项</span>
          <el-button type="primary" link @click="addOption">添加选项</el-button>
        </div>

        <el-table :data="specForm.options" border size="small" style="margin-top: 10px">
          <el-table-column label="选项名称" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.name" placeholder="请输入选项名称" />
            </template>
          </el-table-column>
          <el-table-column label="价格增量" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.price_delta" :precision="2" :step="1" :min="0" style="width: 100%" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link @click="removeOption($index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
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
import { getCommonSpecs, createCommonSpec, updateCommonSpec, deleteCommonSpec } from '../../api/spec'

const loading = ref(false)
const submitting = ref(false)
const specList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref(null)

const specForm = reactive({
  name: '',
  options: []
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getCommonSpecs()
    specList.value = res.result
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  currentId.value = null
  specForm.name = ''
  specForm.options = [{ name: '', price_delta: 0 }]
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentId.value = row.id
  specForm.name = row.name
  specForm.options = row.spec_options.map(opt => ({
    name: opt.name,
    price_delta: Number(opt.price_delta)
  }))
  dialogVisible.value = true
}

const addOption = () => {
  specForm.options.push({ name: '', price_delta: 0 })
}

const removeOption = (index) => {
  specForm.options.splice(index, 1)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除规格【${row.name}】吗？如果该规格已被商品引用，将无法删除。`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteCommonSpec(row.id)
      if (res.code === 0) {
        ElMessage.success('删除成功')
        fetchList()
      } else {
        ElMessage.error(res.message)
      }
    } catch (error) {
      console.error(error)
    }
  })
}

const submitForm = async () => {
  if (!specForm.name.trim()) return ElMessage.warning('请输入规格名称')
  const validOptions = specForm.options.filter(opt => opt.name.trim())
  if (validOptions.length === 0) return ElMessage.warning('至少需要一个有效的规格选项')

  submitting.value = true
  try {
    const payload = {
      name: specForm.name,
      options: validOptions
    }
    if (isEdit.value) {
      await updateCommonSpec(currentId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await createCommonSpec(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  specForm.name = ''
  specForm.options = []
}

onMounted(fetchList)
</script>

<style scoped>
.spec-manage-container {
  padding: 24px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 18px;
  font-weight: 700;
}
.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.spec-tag {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}
.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  font-weight: 600;
}
</style>
