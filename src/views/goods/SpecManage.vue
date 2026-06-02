<template>
  <div class="spec-manage-container">
    <!-- 顶部统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <el-icon size="24"><Operation /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ specList.length }}</span>
          <span class="stat-label">规格模板</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <el-icon size="24"><Grid /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalOptions }}</span>
          <span class="stat-label">选项总数</span>
        </div>
      </div>
    </div>

    <!-- 主卡片 -->
    <el-card class="table-card" shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-input
          v-model="searchKey"
          placeholder="搜索规格名称"
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-button type="primary" round icon="Plus" @click="handleAdd">
          新增规格
        </el-button>
      </div>

      <!-- 规格列表 -->
      <div v-loading="loading" class="spec-list">
        <div v-for="row in filteredList" :key="row.id" class="spec-card">
          <div class="spec-card-header">
            <div class="spec-meta">
              <div class="spec-name-row">
                <span class="spec-name">{{ row.name }}</span>
                <el-tag
                  :type="row.select_type === 'single' ? 'primary' : 'warning'"
                  effect="dark"
                  round
                  size="small"
                >
                  {{ row.select_type === 'single' ? '单选' : '多选' }}
                </el-tag>
                <el-tag v-if="row.is_required" type="danger" effect="plain" round size="small">
                  必选
                </el-tag>
              </div>
              <span class="spec-id">ID: {{ row.id }} · {{ row.spec_options?.length || 0 }} 个选项</span>
            </div>
            <div class="spec-actions">
              <el-button type="primary" plain round size="small" icon="Edit" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button type="danger" plain round size="small" icon="Delete" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </div>
          <div class="spec-card-body">
            <div class="option-chips">
              <span v-for="opt in row.spec_options" :key="opt.id" class="option-chip">
                <span class="option-name">{{ opt.name }}</span>
                <em v-if="opt.price_delta > 0" class="option-delta">+¥{{ opt.price_delta }}</em>
                <el-icon v-if="opt.is_default" class="option-default" size="12"><CircleCheckFilled /></el-icon>
              </span>
              <span v-if="!row.spec_options || row.spec_options.length === 0" class="empty-text">
                暂无选项
              </span>
            </div>
          </div>
        </div>

        <el-empty v-if="!loading && filteredList.length === 0" description="暂无规格模板" />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑规格模板' : '新增规格模板'"
      width="660px"
      class="modern-dialog"
      destroy-on-close
      @close="resetForm"
    >
      <el-form :model="specForm" ref="formRef" label-position="top" class="dialog-form">
        <div class="form-row">
          <el-form-item label="规格名称" class="form-item-half">
            <el-input v-model="specForm.name" placeholder="如：甜度、尺寸、温度" prefix-icon="PriceTag" />
          </el-form-item>
          <el-form-item label="选择模式" class="form-item-half">
            <el-segmented v-model="specForm.select_type" :options="selectTypeOptions" style="width: 100%" />
          </el-form-item>
        </div>

        <el-form-item>
          <el-checkbox v-model="specForm.is_required">
            <span class="checkbox-label">设为必选规格</span>
            <span class="checkbox-desc">用户下单时必须选择该规格</span>
          </el-checkbox>
        </el-form-item>

        <!-- 规格选项 -->
        <div class="options-section">
          <div class="options-header">
            <span class="options-title">
              <el-icon><Grid /></el-icon>
              规格选项
            </span>
            <el-button type="primary" text size="small" icon="Plus" @click="addOption">
              添加选项
            </el-button>
          </div>

          <div class="options-list">
            <TransitionGroup name="option">
              <div v-for="(opt, index) in specForm.options" :key="index" class="option-row">
                <div class="option-index">{{ index + 1 }}</div>
                <el-input v-model="opt.name" placeholder="选项名称" class="option-name-input" />
                <el-input-number
                  v-model="opt.price_delta"
                  :precision="2"
                  :step="1"
                  :min="0"
                  placeholder="价格增量"
                  class="option-price-input"
                  controls-position="right"
                />
                <div class="option-default-toggle">
                  <el-tooltip content="设为默认" placement="top">
                    <el-switch
                      v-model="opt.is_default"
                      size="small"
                      @change="handleDefaultChange(index)"
                    />
                  </el-tooltip>
                </div>
                <el-button
                  type="danger"
                  text
                  circle
                  :icon="Delete"
                  :disabled="specForm.options.length <= 1"
                  @click="removeOption(index)"
                />
              </div>
            </TransitionGroup>
          </div>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" round>取 消</el-button>
          <el-button type="primary" :loading="submitting" round @click="submitForm">
            {{ isEdit ? '保存修改' : '立即创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCommonSpecs, createCommonSpec, updateCommonSpec, deleteCommonSpec } from '../../api/spec'

const loading = ref(false)
const submitting = ref(false)
const specList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref(null)
const searchKey = ref('')

const selectTypeOptions = [
  { label: '单选', value: 'single' },
  { label: '多选', value: 'multiple' }
]

const specForm = reactive({
  name: '',
  select_type: 'single',
  is_required: true,
  options: []
})

// 搜索过滤
const filteredList = computed(() => {
  if (!searchKey.value) return specList.value
  const key = searchKey.value.toLowerCase()
  return specList.value.filter(s => s.name.toLowerCase().includes(key))
})

// 选项总数
const totalOptions = computed(() => {
  return specList.value.reduce((sum, s) => sum + (s.spec_options?.length || 0), 0)
})

// 处理默认选中互斥逻辑
const handleDefaultChange = (index) => {
  if (specForm.select_type === 'single' && specForm.options[index].is_default) {
    specForm.options.forEach((opt, idx) => {
      if (idx !== index) opt.is_default = false
    })
  }
}

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
  specForm.select_type = 'single'
  specForm.is_required = true
  specForm.options = [{ name: '', price_delta: 0, is_default: false }]
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentId.value = row.id
  specForm.name = row.name
  specForm.select_type = row.select_type || 'single'
  specForm.is_required = row.is_required !== undefined ? row.is_required : true
  specForm.options = row.spec_options.map(opt => ({
    name: opt.name,
    price_delta: Number(opt.price_delta),
    is_default: opt.is_default || false
  }))
  dialogVisible.value = true
}

const addOption = () => {
  specForm.options.push({ name: '', price_delta: 0, is_default: false })
}

const removeOption = (index) => {
  specForm.options.splice(index, 1)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除规格「${row.name}」吗？如果该规格已被商品引用，将无法删除。`,
    '确认删除',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
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
      select_type: specForm.select_type,
      is_required: specForm.is_required,
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
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.search-input {
  max-width: 280px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

/* ---- 规格卡片列表 ---- */
.spec-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.spec-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 16px 20px;
  transition: all 0.2s;
}
.spec-card:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.spec-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.spec-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.spec-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.spec-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.spec-id {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.spec-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.spec-card-body {
  padding-top: 4px;
}
.option-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.option-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition: all 0.2s;
}
.option-chip:hover {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}
.option-name {
  font-weight: 500;
}
.option-delta {
  font-style: normal;
  font-size: 12px;
  color: var(--el-color-danger);
  font-weight: 600;
}
.option-default {
  color: var(--el-color-success);
}
.empty-text {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
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
.dialog-form {
  padding: 0;
}
.form-row {
  display: flex;
  gap: 16px;
}
.form-item-half {
  flex: 1;
}
.form-item-half :deep(.el-input__wrapper) {
  border-radius: 8px;
}
.checkbox-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.checkbox-desc {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-left: 4px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ---- 选项编辑区 ---- */
.options-section {
  margin-top: 8px;
}
.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.options-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.option-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  transition: all 0.2s;
}
.option-row:hover {
  background: var(--el-fill-color-light);
}
.option-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.option-name-input {
  flex: 1;
}
.option-name-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}
.option-price-input {
  width: 130px;
}
.option-price-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}
.option-default-toggle {
  flex-shrink: 0;
}

/* ---- 过渡动画 ---- */
.option-enter-active,
.option-leave-active {
  transition: all 0.3s ease;
}
.option-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.option-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* ---- 暗色模式 ---- */
.dark .stat-card {
  background: var(--el-bg-color-overlay);
}
.dark .spec-card {
  background: var(--el-bg-color-overlay);
}
.dark .option-row {
  background: var(--el-fill-color-dark);
}
.dark .option-chip {
  background: var(--el-fill-color-dark);
}
</style>
