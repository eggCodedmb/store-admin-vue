<template>
  <div class="banner-container">
    <!-- 顶部统计 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <el-icon size="24"><Picture /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ total }}</span>
          <span class="stat-label">Banner总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%)">
          <el-icon size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ activeCount }}</span>
          <span class="stat-label">已启用</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%)">
          <el-icon size="24"><Hide /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ inactiveCount }}</span>
          <span class="stat-label">已禁用</span>
        </div>
      </div>
    </div>

    <!-- 主布局：左侧小程序预览，右侧列表管理 -->
    <div class="main-layout">
      <!-- 左侧：小程序高保真效果预览 -->
      <div class="preview-panel">
        <div class="panel-title">小程序首页效果预览</div>
        <div class="phone-mockup">
          <!-- 手机听筒/摄像头 -->
          <div class="phone-earpiece"></div>
          
          <!-- 手机屏幕内容 -->
          <div class="phone-screen">
            <!-- 1. 模拟状态栏 -->
            <div class="status-bar">
              <span class="time">{{ currentTime }}</span>
              <div class="status-icons">
                <span class="icon">📶</span>
                <span class="icon">🛜</span>
                <span class="icon">🔋 100%</span>
              </div>
            </div>

            <!-- 2. 模拟微信小程序顶部胶囊与标题 -->
            <div class="capsule-bar">
              <div class="back-btn">
                <el-icon size="16"><ArrowLeft /></el-icon>
              </div>
              <span class="app-title">益禾堂</span>
              <div class="wechat-capsule">
                <span class="dot">•••</span>
                <span class="divider">|</span>
                <span class="circle">○</span>
              </div>
            </div>

            <!-- 3. 模拟小程序内部页面滚动容器 -->
            <div class="scroll-content">
              <!-- 轮播图预览 -->
              <div class="banner-preview-swiper">
                <el-carousel
                  v-if="activeBannersForPreview.length > 0"
                  height="180px"
                  trigger="click"
                  indicator-position="inside"
                  arrow="none"
                >
                  <el-carousel-item v-for="item in activeBannersForPreview" :key="item.id">
                    <img :src="formatImageUrl(item.image_url)" class="preview-banner-img" />
                  </el-carousel-item>
                </el-carousel>
                <div v-else class="preview-banner-placeholder">
                  <el-icon size="36" color="#999"><Picture /></el-icon>
                  <span class="placeholder-text">暂无启用的 Banner</span>
                </div>
              </div>

              <!-- 门店信息卡片 (重叠在轮播图底部，向上负边距) -->
              <div class="mock-store-card">
                <div class="store-name-row">
                  <span class="store-name">益禾堂 (深圳南山店)</span>
                  <div class="distance-tag">距离您 1.2km</div>
                </div>
                <div class="store-address">深圳市南山区粤海街道高新南一道科技园</div>
              </div>

              <!-- 点单入口 -->
              <div class="mock-entry-row">
                <div class="mock-entry-card">
                  <div class="entry-emoji">🛍️</div>
                  <span class="entry-title">门店自取</span>
                  <span class="entry-desc">下单免排队</span>
                </div>
                <div class="mock-entry-card">
                  <div class="entry-emoji">🛵</div>
                  <span class="entry-title">外卖配送</span>
                  <span class="entry-desc">送到您手中</span>
                </div>
              </div>

              <!-- 每日签到 -->
              <div class="mock-checkin-card">
                <div class="card-header">
                  <span class="header-title">📅 每日签到</span>
                  <span class="header-link">已连续签到 3 天</span>
                </div>
                <div class="checkin-dots">
                  <div v-for="i in 7" :key="i" class="checkin-dot" :class="{ checked: i <= 3 }">
                    <span class="dot-text">{{ i <= 3 ? '✓' : i }}</span>
                  </div>
                </div>
              </div>

              <!-- 快捷入口 -->
              <div class="mock-quick-nav">
                <div class="nav-item">
                  <span class="nav-icon">🎟️</span>
                  <span class="nav-text">我的卡券</span>
                </div>
                <div class="nav-item">
                  <span class="nav-icon">🏆</span>
                  <span class="nav-text">积分商城</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：管理控制台与列表 -->
      <div class="table-panel">
        <el-card class="table-card" shadow="never">
          <!-- 工具栏 -->
          <div class="toolbar">
            <div class="toolbar-left">
              <el-input
                v-model="queryParams.title"
                placeholder="搜索Banner标题"
                prefix-icon="Search"
                clearable
                class="search-input"
                @clear="handleSearch"
                @keyup.enter="handleSearch"
              />
              <el-select
                v-model="queryParams.store_id"
                placeholder="所属门店"
                clearable
                @change="handleSearch"
                class="filter-select"
              >
                <el-option label="全部(全局或门店)" :value="0" />
                <el-option v-for="item in storeOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </div>
            <el-button type="primary" round icon="Plus" @click="handleCreate">添加 Banner</el-button>
          </div>

          <!-- 表格 -->
          <el-table
            v-loading="loading"
            :data="bannerList"
            :header-cell-style="{ background: 'var(--el-fill-color-lighter)', color: 'var(--el-text-color-primary)', fontWeight: 600, fontSize: '13px' }"
            :row-style="{ height: '80px' }"
            class="banner-table"
            height="calc(100vh - 480px)"
            style="width: 100%"
          >
            <el-table-column label="预览图" width="120" align="center">
              <template #default="{ row }">
                <el-image
                  :src="formatImageUrl(row.image_url)"
                  :preview-src-list="[formatImageUrl(row.image_url)]"
                  fit="cover"
                  class="table-banner-img"
                  preview-teleported
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </template>
            </el-table-column>

            <el-table-column prop="title" label="Banner 标题" min-width="150" show-overflow-tooltip />

            <el-table-column prop="store_id" label="适用范围" width="150">
              <template #default="{ row }">
                <el-tag :type="row.store_id ? 'warning' : 'success'" round size="small">
                  {{ getStoreName(row.store_id) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="link_path" label="跳转路径" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="path-text">{{ row.link_path || '无跳转' }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="sort_order" label="排序" width="120" align="center">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.sort_order"
                  :min="0"
                  size="small"
                  controls-position="right"
                  class="sort-input"
                  @change="(val) => handleSortOrderChange(row, val)"
                />
              </template>
            </el-table-column>

            <el-table-column label="启用状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch
                  v-model="row.is_active"
                  active-color="#00b894"
                  inactive-color="#dcdfe6"
                  @change="(val) => handleStatusChange(row, val)"
                />
              </template>
            </el-table-column>

            <el-table-column label="移动排序" width="110" align="center">
              <template #default="{ row, $index }">
                <el-button-group>
                  <el-button
                    type="primary"
                    plain
                    size="small"
                    icon="CaretTop"
                    :disabled="$index === 0 && queryParams.pageNum === 1"
                    @click="moveRow($index, -1)"
                  />
                  <el-button
                    type="primary"
                    plain
                    size="small"
                    icon="CaretBottom"
                    :disabled="$index === bannerList.length - 1 && queryParams.pageNum * queryParams.pageSize >= total"
                    @click="moveRow($index, 1)"
                  />
                </el-button-group>
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
                      <el-dropdown-item command="edit" icon="Edit">编辑 Banner</el-dropdown-item>
                      <el-dropdown-item command="delete" icon="Delete" divided>删除 Banner</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <span class="pagination-info">
              共 <b>{{ total }}</b> 个 Banner
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
    </div>

    <!-- 添加/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="550px"
      destroy-on-close
      class="modern-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="dialog-form"
      >
        <el-form-item label="Banner 标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题 (如: 夏季新品特惠)" />
        </el-form-item>

        <el-form-item label="适用范围 (门店)" prop="store_id">
          <el-select v-model="form.store_id" placeholder="选择特定门店，不选则全店通用" clearable style="width: 100%">
            <el-option label="全局通用 (适用于所有门店)" :value="null" />
            <el-option v-for="item in storeOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="跳转路径" prop="link_path">
          <el-input v-model="form.link_path" placeholder="请输入小程序跳转路径 (如: /pages/menu/menu，可不填)" />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="排序权重" prop="sort_order" class="form-item-half">
            <el-input-number v-model="form.sort_order" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="是否启用" prop="is_active" class="form-item-half">
            <div style="height: 32px; display: flex; align-items: center">
              <el-switch v-model="form.is_active" active-color="#00b894" />
            </div>
          </el-form-item>
        </div>

        <el-form-item label="Banner 图片" prop="image_url" required>
          <el-upload
            class="banner-uploader"
            :action="baseURL + '/upload'"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeImageUpload"
            :headers="uploadHeaders"
            name="file"
          >
            <div v-if="form.image_url" class="banner-preview">
              <img :src="formatImageUrl(form.image_url)" class="banner-preview-img" />
              <div class="banner-mask">
                <el-icon size="24" color="#fff"><Edit /></el-icon>
              </div>
            </div>
            <div v-else class="banner-uploader-placeholder">
              <el-icon size="28" color="#8c939d"><Plus /></el-icon>
              <span class="upload-tip">建议尺寸: 750 * 450 像素</span>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" round>取 消</el-button>
          <el-button type="primary" :loading="submitting" round @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getBannerList,
  createBanner,
  updateBanner,
  deleteBanner
} from '../../api/banner'
import { getStoreList } from '../../api/store'
import { baseURL } from '../../utils/request'
import dayjs from 'dayjs'

// 列表与分页状态
const loading = ref(false)
const bannerList = ref([])
const total = ref(0)
const storeOptions = ref([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  title: '',
  store_id: 0
})

// 状态卡片统计
const activeCount = ref(0)
const inactiveCount = ref(0)

// 手机预览实时时间
const currentTime = ref('12:00')
let timerId = null

const updateCurrentTime = () => {
  currentTime.value = dayjs().format('HH:mm')
}

// 模拟数据供小程序预览使用（仅获取启用的 banners 列表）
const activeBannersForPreview = computed(() => {
  return bannerList.value
    .filter(b => b.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
})

// 获取门店名称
const getStoreName = (storeId) => {
  if (!storeId) return '全局通用'
  const store = storeOptions.value.find(s => s.id === storeId)
  return store ? store.name : `门店 (ID: ${storeId})`
}

// 格式化图片地址
const formatImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/online') || url.startsWith('/local') || url.startsWith('/test') || url.startsWith('online') || url.startsWith('local') || url.startsWith('test')) {
    return url.startsWith('/') ? url : '/' + url
  }
  return baseURL + url
}

// 获取列表数据
const fetchList = async () => {
  loading.value = true
  try {
    const res = await getBannerList(queryParams)
    bannerList.value = res.result.list || []
    total.value = res.result.total || 0
    
    // 更新统计数据
    activeCount.value = bannerList.value.filter(b => b.is_active).length
    inactiveCount.value = bannerList.value.filter(b => !b.is_active).length
  } catch (error) {
    console.error('获取Banner列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取门店选项
const fetchStores = async () => {
  try {
    const res = await getStoreList({ pageNum: 1, pageSize: 100 })
    storeOptions.value = res.result.list || []
  } catch (error) {
    console.error('获取门店列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  queryParams.pageNum = 1
  fetchList()
}

// 分页变化
const handleSizeChange = (val) => {
  queryParams.pageSize = val
  fetchList()
}

const handleCurrentChange = (val) => {
  queryParams.pageNum = val
  fetchList()
}

// 状态切换事件
const handleStatusChange = async (row, val) => {
  try {
    await updateBanner(row.id, { is_active: val })
    ElMessage.success(`${val ? '启用' : '禁用'}成功`)
    // 更新统计
    activeCount.value = bannerList.value.filter(b => b.is_active).length
    inactiveCount.value = bannerList.value.filter(b => !b.is_active).length
  } catch (error) {
    row.is_active = !val // 失败时回滚状态
  }
}

// 排序输入框发生改变
const handleSortOrderChange = async (row, val) => {
  try {
    await updateBanner(row.id, { sort_order: val })
    ElMessage.success('排序更新成功')
    // 重新排序列表
    bannerList.value.sort((a, b) => a.sort_order - b.sort_order)
  } catch (error) {
    console.error(error)
  }
}

// 向上或向下移动排序
const moveRow = async (index, direction) => {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= bannerList.value.length) return
  
  const currentRow = bannerList.value[index]
  const targetRow = bannerList.value[targetIndex]
  
  // 临时交换排序权重
  const tempOrder = currentRow.sort_order
  currentRow.sort_order = targetRow.sort_order
  targetRow.sort_order = tempOrder
  
  // 如果两个值一样，强行拉开差距
  if (currentRow.sort_order === targetRow.sort_order) {
    if (direction < 0) {
      currentRow.sort_order = Math.max(0, targetRow.sort_order - 1)
    } else {
      currentRow.sort_order = targetRow.sort_order + 1
    }
  }

  try {
    loading.value = true
    await Promise.all([
      updateBanner(currentRow.id, { sort_order: currentRow.sort_order }),
      updateBanner(targetRow.id, { sort_order: targetRow.sort_order })
    ])
    ElMessage.success('排序移动成功')
    fetchList()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 下拉菜单操作
const handleCommand = (command, row) => {
  if (command === 'edit') {
    handleEdit(row)
  } else if (command === 'delete') {
    handleDelete(row)
  }
}

// 表框表单与校验
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  id: null,
  title: '',
  image_url: '',
  sort_order: 0,
  is_active: true,
  link_path: '',
  store_id: null
})

const rules = {
  title: [
    { required: true, message: '请输入Banner标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  image_url: [
    { required: true, message: '请上传Banner图片', trigger: 'change' }
  ]
}

const resetForm = () => {
  form.id = null
  form.title = ''
  form.image_url = ''
  form.sort_order = 0
  form.is_active = true
  form.link_path = ''
  form.store_id = null
}

const handleCreate = () => {
  resetForm()
  dialogTitle.value = '添加 Banner 轮播图'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  resetForm()
  dialogTitle.value = '编辑 Banner 轮播图'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除名称为 "${row.title}" 的 Banner 吗？此操作不可逆！`,
    '系统提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      roundButton: true
    }
  ).then(async () => {
    try {
      await deleteBanner(row.id)
      ElMessage.success('删除成功')
      fetchList()
    } catch (error) {
      console.error(error)
    }
  }).catch(() => {})
}

// 上传凭证和钩子
const token = localStorage.getItem('token')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${token}`
}))

const beforeImageUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPGorPNG) {
    ElMessage.error('上传图片只能是 JPG/JPEG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
  }
  return isJPGorPNG && isLt2M
}

const handleUploadSuccess = (res) => {
  if (res.code === 0) {
    form.image_url = res.result.url
    ElMessage.success('上传图片成功')
  } else {
    ElMessage.error(res.message || '上传图片失败')
  }
}

// 提交表单
const submitForm = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (form.id) {
          await updateBanner(form.id, form)
          ElMessage.success('修改Banner成功')
        } else {
          await createBanner(form)
          ElMessage.success('新增Banner成功')
        }
        dialogVisible.value = false
        fetchList()
      } catch (error) {
        console.error(error)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchStores()
  fetchList()
  updateCurrentTime()
  timerId = setInterval(updateCurrentTime, 60000) // 每分钟刷新一次模拟时钟
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})
</script>

<style scoped>
.banner-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: var(--el-bg-color);
  min-height: calc(100vh - 120px);
}

/* ---- 顶部统计 ---- */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.stat-card {
  background: var(--el-bg-color-overlay);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ---- 主布局 ---- */
.main-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

/* ---- 左侧预览面板 ---- */
.preview-panel {
  width: 340px;
  background: var(--el-bg-color-overlay);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}
.panel-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

/* ---- 手机模型 ---- */
.phone-mockup {
  width: 300px;
  height: 600px;
  background: #000;
  border-radius: 36px;
  padding: 10px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  position: relative;
}
.phone-earpiece {
  width: 60px;
  height: 8px;
  background: #333;
  border-radius: 4px;
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}
.phone-screen {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  border-radius: 28px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  border: 1px solid #1a1a1a;
  user-select: none;
}

/* 模拟状态栏 */
.status-bar {
  height: 38px;
  padding: 0 18px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 11px;
  color: #333;
  font-weight: 600;
  background: #fff;
  z-index: 5;
}
.status-icons {
  display: flex;
  gap: 4px;
  font-size: 9px;
  align-items: center;
}

/* 模拟小程序导航条 */
.capsule-bar {
  height: 40px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  position: relative;
  z-index: 5;
}
.back-btn {
  color: #333;
  display: flex;
  align-items: center;
}
.app-title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}
.wechat-capsule {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 3px 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #333;
  height: 24px;
}
.wechat-capsule .dot {
  font-weight: bold;
}
.wechat-capsule .divider {
  color: rgba(0, 0, 0, 0.15);
}

/* 模拟小程序内容滚动区 */
.scroll-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 20px;
}
.scroll-content::-webkit-scrollbar {
  display: none; /* 隐藏滚动条 */
}

/* 轮播图预览组件 */
.banner-preview-swiper {
  width: 100%;
  height: 180px;
  background: #e0e0e0;
}
.preview-banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.preview-banner-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #eaeaea;
}
.placeholder-text {
  font-size: 12px;
  color: #999;
}
.banner-preview-swiper :deep(.el-carousel__button) {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #fff;
}
.banner-preview-swiper :deep(.el-carousel__indicator.is-active .el-carousel__button) {
  background-color: #00cc99; /* 益禾堂主绿色 */
  width: 12px;
  border-radius: 3px;
}

/* 模拟门店卡片 */
.mock-store-card {
  background: #fff;
  margin: 0 10px;
  padding: 12px;
  border-radius: 8px;
  position: relative;
  z-index: 2;
  margin-top: -15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.store-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.store-name {
  font-size: 13px;
  font-weight: bold;
  color: #333;
}
.distance-tag {
  background: #e6f9f5;
  color: #00cc99;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 10px;
}
.store-address {
  font-size: 10px;
  color: #999;
}

/* 模拟自取外卖大入口 */
.mock-entry-row {
  display: flex;
  padding: 8px;
  gap: 8px;
}
.mock-entry-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 12px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}
.entry-emoji {
  font-size: 24px;
  margin-bottom: 4px;
}
.mock-entry-card .entry-title {
  font-size: 13px;
  font-weight: bold;
  color: #333;
}
.mock-entry-card .entry-desc {
  font-size: 9px;
  color: #999;
}

/* 模拟签到卡片 */
.mock-checkin-card {
  background: #fff;
  margin: 0 10px;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title {
  font-size: 11px;
  font-weight: bold;
  color: #333;
}
.header-link {
  font-size: 9px;
  color: #00cc99;
}
.checkin-dots {
  display: flex;
  justify-content: space-between;
}
.checkin-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.checkin-dot.checked {
  background: #00cc99;
  color: #fff;
}
.dot-text {
  font-size: 9px;
  font-weight: bold;
}

/* 模拟快捷导航 */
.mock-quick-nav {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.nav-icon {
  font-size: 18px;
}
.nav-text {
  font-size: 10px;
  color: #666;
}

/* ---- 右侧表格管理面板 ---- */
.table-panel {
  flex: 1;
}
.table-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* ---- 工具栏 ---- */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.toolbar-left {
  display: flex;
  gap: 12px;
}
.search-input {
  width: 240px;
}
.filter-select {
  width: 180px;
}
.toolbar-left :deep(.el-input__wrapper),
.toolbar-left :deep(.el-select .el-input__wrapper) {
  border-radius: 20px;
}

/* ---- 表格内元素样式 ---- */
.table-banner-img {
  width: 90px;
  height: 54px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  display: block;
  margin: 0 auto;
}
.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-placeholder);
  font-size: 20px;
  border-radius: 6px;
}
.path-text {
  font-family: monospace;
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.sort-input {
  width: 90px;
}
.sort-input :deep(.el-input__wrapper) {
  border-radius: 4px;
}
.action-btn {
  font-weight: 500;
}

/* ---- 分页 ---- */
.pagination-container {
  margin-top: 20px;
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

/* ---- 弹窗配置 ---- */
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

/* ---- 上传器 ---- */
.banner-uploader {
  width: 100%;
}
.banner-uploader :deep(.el-upload) {
  border: 1px dashed var(--el-border-color);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  transition: var(--el-transition-duration-fast);
}
.banner-uploader :deep(.el-upload:hover) {
  border-color: var(--el-color-primary);
}
.banner-uploader-placeholder {
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.banner-preview {
  width: 100%;
  height: 180px;
  position: relative;
}
.banner-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.banner-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s;
}
.banner-preview:hover .banner-mask {
  opacity: 1;
}

.form-row {
  display: flex;
  gap: 20px;
}
.form-item-half {
  flex: 1;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ---- 暗黑模式适配 ---- */
.dark .stat-card {
  background: var(--el-bg-color-overlay);
}
.dark .preview-panel {
  background: var(--el-bg-color-overlay);
}
.dark .mock-store-card,
.dark .mock-entry-card,
.dark .mock-checkin-card,
.dark .mock-quick-nav,
.dark .status-bar,
.dark .capsule-bar {
  background: #1f1f1f;
  color: #eee;
}
.dark .mock-store-card .store-name,
.dark .capsule-bar .app-title,
.dark .status-bar .time,
.dark .mock-entry-card .entry-title,
.dark .mock-checkin-card .header-title {
  color: #eee;
}
.dark .checkin-dot {
  background: #333;
}
</style>
