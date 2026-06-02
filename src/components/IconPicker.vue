<template>
  <div class="icon-picker-wrapper">
    <!-- 触发区域 -->
    <div class="icon-picker-trigger" @click="visible = true">
      <template v-if="modelValue">
        <SvgIcon :icon="modelValue" :size="18" />
        <span class="icon-picker-trigger__name">{{ modelValue }}</span>
      </template>
      <template v-else>
        <el-icon :size="18"><Plus /></el-icon>
        <span class="icon-picker-trigger__name">选择图标</span>
      </template>
      <el-icon v-if="modelValue" class="icon-picker-trigger__clear" @click.stop="handleClear">
        <CircleClose />
      </el-icon>
    </div>

    <!-- 图标选择弹窗 -->
    <el-dialog
      v-model="visible"
      title="图标选择器"
      width="780px"
      :append-to-body="true"
      destroy-on-close
      top="6vh"
    >
      <div class="icon-picker">
        <!-- 搜索栏 -->
        <el-input
          v-model="searchQuery"
          placeholder="搜索图标..."
          clearable
          prefix-icon="Search"
          class="icon-picker__search"
        />

        <div class="icon-picker__body">
          <!-- 左侧分类列表 -->
          <el-scrollbar class="icon-picker__sidebar">
            <div
              v-for="col in collections"
              :key="col.prefix"
              class="icon-picker__category"
              :class="{ 'is-active': activePrefix === col.prefix }"
              @click="handleSwitchCategory(col.prefix)"
            >
              <span class="icon-picker__category-name">{{ col.name }}</span>
              <el-tag size="small" type="info" round>{{ col.prefix }}</el-tag>
            </div>
          </el-scrollbar>

          <!-- 右侧图标网格 -->
          <div class="icon-picker__main">
            <el-scrollbar ref="scrollbarRef" class="icon-picker__grid-scroll">
              <div v-loading="loading" class="icon-picker__grid-container">
                <!-- 空状态 -->
                <el-empty
                  v-if="!loading && pagedIcons.length === 0"
                  description="暂无图标"
                  :image-size="80"
                />
                <!-- 图标网格 -->
                <div v-else class="icon-picker__grid">
                  <div
                    v-for="name in pagedIcons"
                    :key="name"
                    class="icon-picker__item"
                    :class="{ 'is-active': modelValue === `${activePrefix}:${name}` }"
                    :title="`${activePrefix}:${name}`"
                    @click="handleSelect(name)"
                  >
                    <SvgIcon :icon="`${activePrefix}:${name}`" :size="22" />
                  </div>
                </div>
              </div>
            </el-scrollbar>

            <!-- 分页 -->
            <div v-if="filteredIcons.length > pageSize" class="icon-picker__pagination">
              <el-pagination
                v-model:current-page="currentPage"
                :page-size="pageSize"
                :total="filteredIcons.length"
                layout="prev, pager, next"
                small
                background
              />
            </div>
          </div>
        </div>

        <!-- 底部选中信息 -->
        <div v-if="modelValue" class="icon-picker__footer">
          <span class="icon-picker__preview-label">当前选中：</span>
          <SvgIcon :icon="modelValue" :size="20" />
          <el-tag type="primary" size="small" class="icon-picker__preview-name">
            {{ modelValue }}
          </el-tag>
        </div>
      </div>

      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { iconCollections, fetchIconsByPrefix } from '../config/icons'

const props = defineProps({
  /** 当前选中的图标名，格式：prefix:name */
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

// ---------- 状态 ----------
const visible = ref(false)
const searchQuery = ref('')
const activePrefix = ref('mdi')
const currentPage = ref(1)
const loading = ref(false)
const allIcons = ref([]) // 当前分类下的全部图标名
const pageSize = 108 // 每页显示数量（18列 × 6行）

// ---------- 图标集列表 ----------
const collections = iconCollections

// ---------- 计算属性 ----------

/** 搜索过滤后的图标列表 */
const filteredIcons = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return allIcons.value
  return allIcons.value.filter(name => name.includes(q))
})

/** 当前分页的图标列表 */
const pagedIcons = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredIcons.value.slice(start, start + pageSize)
})

// ---------- 方法 ----------

/** 加载指定分类的图标列表 */
async function loadIcons(prefix) {
  loading.value = true
  allIcons.value = []
  try {
    allIcons.value = await fetchIconsByPrefix(prefix)
  } finally {
    loading.value = false
  }
}

/** 切换图标集分类 */
function handleSwitchCategory(prefix) {
  if (prefix === activePrefix.value) return
  activePrefix.value = prefix
  searchQuery.value = ''
  currentPage.value = 1
  loadIcons(prefix)
}

/** 选中图标 */
function handleSelect(name) {
  emit('update:modelValue', `${activePrefix.value}:${name}`)
}

/** 清空选中 */
function handleClear() {
  emit('update:modelValue', '')
}

/** 确认选择并关闭弹窗 */
function handleConfirm() {
  visible.value = false
}

// ---------- 监听 ----------

// 搜索时重置到第一页
watch(searchQuery, () => {
  currentPage.value = 1
})

// 打开弹窗时加载默认分类
watch(visible, (val) => {
  if (val) {
    // 如果已有选中图标，定位到对应分类
    if (props.modelValue && props.modelValue.includes(':')) {
      const prefix = props.modelValue.split(':')[0]
      const exists = collections.find(c => c.prefix === prefix)
      if (exists) activePrefix.value = prefix
    }
    loadIcons(activePrefix.value)
  } else {
    // 关闭时重置搜索
    searchQuery.value = ''
    currentPage.value = 1
  }
})
</script>

<style scoped>
.icon-picker-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 160px;
  height: 32px;
  box-sizing: border-box;
}

.icon-picker-trigger:hover {
  border-color: var(--el-color-primary);
}

.icon-picker-trigger__name {
  font-size: 13px;
  color: var(--el-text-color-regular);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-picker-trigger__clear {
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

.icon-picker-trigger__clear:hover {
  color: var(--el-color-danger);
}

/* ---- 弹窗内部布局 ---- */

.icon-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-picker__search {
  flex-shrink: 0;
}

.icon-picker__body {
  display: flex;
  gap: 12px;
  height: 440px;
  min-height: 0;
}

/* 左侧分类栏 */
.icon-picker__sidebar {
  width: 170px;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  padding-right: 12px;
}

.icon-picker__category {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 2px;
}

.icon-picker__category:hover {
  background: var(--el-fill-color-light);
}

.icon-picker__category.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.icon-picker__category-name {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 6px;
}

/* 右侧图标区域 */
.icon-picker__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.icon-picker__grid-scroll {
  flex: 1;
  min-height: 0;
}

.icon-picker__grid-container {
  min-height: 100%;
}

.icon-picker__grid {
  display: grid;
  grid-template-columns: repeat(18, 1fr);
  gap: 4px;
}

.icon-picker__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--el-text-color-regular);
}

.icon-picker__item:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  transform: scale(1.15);
}

.icon-picker__item.is-active {
  background: var(--el-color-primary);
  color: #fff;
}

/* 分页 */
.icon-picker__pagination {
  display: flex;
  justify-content: center;
  padding-top: 8px;
  flex-shrink: 0;
}

/* 底部选中信息 */
.icon-picker__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.icon-picker__preview-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.icon-picker__preview-name {
  font-family: monospace;
}
</style>
