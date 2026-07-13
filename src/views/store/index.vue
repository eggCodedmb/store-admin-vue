<template>
  <div class="store-container">
    <!-- 顶部统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <el-icon size="24"><OfficeBuilding /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ total }}</span>
          <span class="stat-label">门店总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%)">
          <el-icon size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ openCount }}</span>
          <span class="stat-label">营业中</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%)">
          <el-icon size="24"><CircleClose /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ closedCount }}</span>
          <span class="stat-label">已关闭</span>
        </div>
      </div>
    </div>

    <!-- 主表格卡片 -->
    <el-card class="table-card" shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索门店名称 / 地址"
            prefix-icon="Search"
            clearable
            class="search-input"
            @keyup.enter="fetchStores"
            @clear="fetchStores"
          />
          <el-select v-model="queryParams.status" placeholder="门店状态" clearable @change="fetchStores" class="filter-select">
            <el-option label="营业中" :value="1" />
            <el-option label="已关闭" :value="0" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-button round icon="MapLocation" @click="mapPreviewVisible = true">地图预览</el-button>
          <el-button type="primary" round icon="Plus" @click="handleCreate">新增门店</el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="storeList"
        :header-cell-style="{ background: 'var(--el-fill-color-lighter)', color: 'var(--el-text-color-primary)', fontWeight: 600, fontSize: '13px' }"
        :row-style="{ height: '76px' }"
        class="store-table"
        height="calc(100vh - 480px)"
        style="width: 100%"
      >
        <el-table-column label="门店信息" min-width="260">
          <template #default="{ row }">
            <div class="store-cell">
              <div class="store-cover" v-if="row.cover">
                <el-image
                  :src="formatImageUrl(row.cover)"
                  fit="cover"
                  class="cover-img"
                  :preview-src-list="[formatImageUrl(row.cover)]"
                  preview-teleported
                />
              </div>
              <div v-else class="cover-placeholder">
                <el-icon size="20"><Picture /></el-icon>
              </div>
              <div class="store-detail">
                <span class="store-name">{{ row.name }}</span>
                <span class="store-addr">
                  <el-icon size="12"><Location /></el-icon>
                  {{ formatFullAddress(row) }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="联系电话" width="140">
          <template #default="{ row }">
            <span v-if="row.phone" class="phone-text">
              <el-icon size="13"><Phone /></el-icon>
              {{ row.phone }}
            </span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="营业时间" min-width="200">
          <template #default="{ row }">
            <div class="time-tags">
              <el-tag
                v-for="item in parseBusinessHours(row.business_hours)"
                :key="item"
                effect="plain"
                round
                size="small"
                class="time-tag"
              >
                <el-icon size="12"><Clock /></el-icon>
                {{ item }}
              </el-tag>
              <span v-if="!parseBusinessHours(row.business_hours).length" class="empty-text">未设置</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <div class="status-badge" :class="row.status === 1 ? 'status-open' : 'status-closed'">
              <span class="status-dot"></span>
              {{ row.status === 1 ? '营业中' : '已关闭' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="170" align="center">
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
                  <el-dropdown-item command="edit" icon="Edit">编辑门店</el-dropdown-item>
                  <el-dropdown-item command="delete" icon="Delete" divided>删除门店</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <span class="pagination-info">
          共 <b>{{ total }}</b> 家门店
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增门店' : '编辑门店'"
      width="1280px"
      class="modern-dialog"
      destroy-on-close
      top="2vh"
    >
      <div class="store-form-layout">
        <!-- 左侧：表单 -->
        <div class="form-left">
          <el-scrollbar max-height="calc(90vh - 120px)">
            <el-form
              ref="storeFormRef"
              :model="storeForm"
              :rules="rules"
              label-position="top"
              class="store-form"
            >
              <el-form-item label="门店名称" prop="name">
                <el-input v-model="storeForm.name" placeholder="请输入门店名称" maxlength="50" show-word-limit prefix-icon="OfficeBuilding" />
              </el-form-item>

              <div class="form-row">
                <el-form-item label="联系电话" class="form-item-half">
                  <el-input v-model="storeForm.phone" placeholder="请输入联系电话" prefix-icon="Phone" />
                </el-form-item>
                <el-form-item label="门店状态" class="form-item-half">
                  <el-switch
                    v-model="storeForm.status"
                    :active-value="1"
                    :inactive-value="0"
                    active-text="营业中"
                    inactive-text="已关闭"
                    inline-prompt
                    style="--el-switch-on-color: #00b894; --el-switch-off-color: #dfe6e9"
                  />
                </el-form-item>
              </div>

              <el-form-item label="营业时间">
                <div v-for="(time, index) in storeForm.business_hours_list" :key="index" class="time-range-item">
                  <el-time-picker
                    v-model="storeForm.business_hours_list[index]"
                    is-range
                    range-separator="至"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="flex: 1"
                  />
                  <el-button
                    v-if="storeForm.business_hours_list.length > 1"
                    type="danger"
                    text
                    circle
                    icon="Delete"
                    @click="removeTimeRange(index)"
                  />
                </div>
                <el-button type="primary" text size="small" icon="Plus" @click="addTimeRange" style="margin-top: 4px">
                  添加时间段
                </el-button>
              </el-form-item>

              <el-form-item label="详细地址">
                <el-input v-model="storeForm.address" placeholder="地图选点后自动回填，也可手动输入" prefix-icon="Location" />
              </el-form-item>

              <div class="form-row">
                <el-form-item label="省" class="form-item-third">
                  <el-input v-model="storeForm.province" placeholder="省" disabled />
                </el-form-item>
                <el-form-item label="市" class="form-item-third">
                  <el-input v-model="storeForm.city" placeholder="市" disabled />
                </el-form-item>
                <el-form-item label="区/县" class="form-item-third">
                  <el-input v-model="storeForm.district" placeholder="区/县" disabled />
                </el-form-item>
              </div>

              <el-form-item label="门店描述">
                <el-input v-model="storeForm.description" type="textarea" :rows="3" placeholder="请输入门店描述" maxlength="200" show-word-limit />
              </el-form-item>
            </el-form>
          </el-scrollbar>
        </div>

        <!-- 右侧：地图 + 照片 -->
        <div class="form-right">
          <div class="map-section">
            <div class="section-header">
              <el-icon><MapLocation /></el-icon>
              <span>门店位置</span>
            </div>
            <MapPicker
              v-model="mapCoords"
              :address="storeForm.address"
              @location-change="onLocationChange"
            />
          </div>

          <div class="photo-section">
            <div class="section-header">
              <el-icon><Picture /></el-icon>
              <span>门店照片</span>
            </div>

            <!-- 封面图 -->
            <div class="photo-group">
              <div class="photo-label">封面图</div>
              <el-upload
                class="cover-uploader"
                :action="baseURL + '/upload'"
                :show-file-list="false"
                :on-success="handleCoverSuccess"
                :before-upload="beforeImageUpload"
                :headers="uploadHeaders"
                name="file"
              >
                <div v-if="storeForm.cover" class="cover-preview">
                  <img :src="formatImageUrl(storeForm.cover)" class="cover-preview-img" />
                  <div class="cover-mask">
                    <el-icon size="20"><Edit /></el-icon>
                  </div>
                </div>
                <div v-else class="cover-placeholder">
                  <el-icon size="24"><Plus /></el-icon>
                  <span>上传封面</span>
                </div>
              </el-upload>
            </div>

            <!-- 门店相册 -->
            <div class="photo-group">
              <div class="photo-label">
                门店相册
                <span class="photo-count">({{ storeForm.photos.length }}/9)</span>
              </div>
              <div class="photo-list">
                <div v-for="(photo, index) in storeForm.photos" :key="index" class="photo-item">
                  <img :src="formatImageUrl(photo)" class="photo-img" />
                  <div class="photo-actions">
                    <el-icon class="photo-action-icon" @click.stop="removePhoto(index)"><Delete /></el-icon>
                  </div>
                </div>
                <el-upload
                  v-if="storeForm.photos.length < 9"
                  class="photo-uploader"
                  :action="baseURL + '/upload'"
                  :show-file-list="false"
                  :on-success="handlePhotoSuccess"
                  :before-upload="beforeImageUpload"
                  :headers="uploadHeaders"
                  name="file"
                >
                  <div class="photo-add">
                    <el-icon size="20"><Plus /></el-icon>
                  </div>
                </el-upload>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" round>取 消</el-button>
          <el-button type="primary" :loading="submitting" round @click="submitForm">
            {{ dialogType === 'create' ? '创建门店' : '保存修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 地图预览弹窗 -->
    <el-dialog
      v-model="mapPreviewVisible"
      title="门店地图预览"
      fullscreen
      class="modern-dialog"
      destroy-on-close
    >
      <StoreMapPreview />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStoreList, getStoreDetail, createStore, updateStore, deleteStore } from '../../api/store'
import { baseURL } from '../../utils/request'
import dayjs from 'dayjs'
import MapPicker from '../../components/MapPicker.vue'
import StoreMapPreview from '../../components/StoreMapPreview.vue'

const storeList = ref([])
const loading = ref(false)
const total = ref(0)
const dialogVisible = ref(false)
const dialogType = ref('create')
const submitting = ref(false)
const storeFormRef = ref(null)
const mapPreviewVisible = ref(false)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  keyword: '',
  status: ''
})

const storeForm = reactive({
  id: null,
  name: '',
  description: '',
  address: '',
  phone: '',
  status: 1,
  province: '',
  city: '',
  district: '',
  cover: '',
  business_hours_list: [['08:00', '22:00']],
  photos: []
})

const mapCoords = ref(null)

const rules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }]
}

const token = localStorage.getItem('token')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${token}`
}))

// 统计
const openCount = computed(() => storeList.value.filter(s => s.status === 1).length)
const closedCount = computed(() => storeList.value.filter(s => s.status !== 1).length)

const formatImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/online') || url.startsWith('/local') || url.startsWith('/test') || url.startsWith('online') || url.startsWith('local') || url.startsWith('test')) {
    return url.startsWith('/') ? url : '/' + url
  }
  return baseURL + url
}

const formatTime = (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'

const formatFullAddress = (row) => {
  const parts = [row.province, row.city, row.district, row.address].filter(Boolean)
  return parts.length ? parts.join(' ') : '-'
}

const parseBusinessHours = (str) => {
  if (!str) return []
  try { return JSON.parse(str) } catch { return [str] }
}

const beforeImageUpload = (file) => {
  const isImage = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) { ElMessage.error('只能上传 JPG/PNG/WebP 格式图片'); return false }
  if (!isLt2M) { ElMessage.error('图片大小不能超过 2MB'); return false }
  return true
}

const handleCoverSuccess = (response) => {
  if (response.code === 0) storeForm.cover = response.result.url
}

const handlePhotoSuccess = (response) => {
  if (response.code === 0 && storeForm.photos.length < 9) storeForm.photos.push(response.result.url)
}

const removePhoto = (index) => { storeForm.photos.splice(index, 1) }

const onLocationChange = ({ lng, lat, address, province, city, district }) => {
  storeForm.address = address || storeForm.address
  storeForm.province = province || ''
  storeForm.city = city || ''
  storeForm.district = district || ''
}

const addTimeRange = () => { storeForm.business_hours_list.push(['08:00', '22:00']) }
const removeTimeRange = (index) => { storeForm.business_hours_list.splice(index, 1) }

const handleCommand = (cmd, row) => {
  if (cmd === 'edit') handleEdit(row)
  else if (cmd === 'delete') handleDelete(row)
}

const resetForm = () => {
  storeForm.id = null
  storeForm.name = ''
  storeForm.description = ''
  storeForm.address = ''
  storeForm.phone = ''
  storeForm.status = 1
  storeForm.province = ''
  storeForm.city = ''
  storeForm.district = ''
  storeForm.cover = ''
  storeForm.business_hours_list = [['08:00', '22:00']]
  storeForm.photos = []
  mapCoords.value = null
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
    const res = await getStoreDetail(row.id)
    const data = res.result
    storeForm.id = data.id
    storeForm.name = data.name || ''
    storeForm.description = data.description || ''
    storeForm.address = data.address || ''
    storeForm.phone = data.phone || ''
    storeForm.status = data.status !== undefined ? data.status : 1
    storeForm.province = data.province || ''
    storeForm.city = data.city || ''
    storeForm.district = data.district || ''
    storeForm.cover = data.cover || ''
    const ranges = parseBusinessHours(data.business_hours)
    storeForm.business_hours_list = ranges.map(r => r.split('-'))
    if (storeForm.business_hours_list.length === 0) storeForm.business_hours_list = [['08:00', '22:00']]
    storeForm.photos = (data.photos || []).map(p => p.url)
    if (data.longitude && data.latitude) mapCoords.value = { lng: Number(data.longitude), lat: Number(data.latitude) }
    dialogVisible.value = true
  } catch (error) {
    console.error('获取门店详情失败:', error)
  }
}

const fetchStores = async () => {
  loading.value = true
  try {
    const params = { ...queryParams }
    if (params.status === '') delete params.status
    const res = await getStoreList(params)
    storeList.value = res.result.list || []
    total.value = res.result.total || 0
  } catch (error) {
    console.error('获取门店失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => { queryParams.pageSize = val; fetchStores() }
const handleCurrentChange = (val) => { queryParams.pageNum = val; fetchStores() }

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
          phone: storeForm.phone,
          status: storeForm.status,
          province: storeForm.province,
          city: storeForm.city,
          district: storeForm.district,
          cover: storeForm.cover,
          business_hours: JSON.stringify(businessHours),
          longitude: mapCoords.value?.lng || null,
          latitude: mapCoords.value?.lat || null,
          photos: storeForm.photos
        }
        if (dialogType.value === 'create') {
          await createStore(payload)
          ElMessage.success('门店创建成功')
        } else {
          await updateStore(storeForm.id, payload)
          ElMessage.success('门店更新成功')
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
  ElMessageBox.confirm(`确定要删除门店「${row.name}」吗？删除后不可恢复。`, '确认删除', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    try {
      await deleteStore(row.id)
      ElMessage.success('门店已删除')
      fetchStores()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }).catch(() => {})
}

fetchStores()
</script>

<style scoped>
.store-container {
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
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.search-input {
  width: 260px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}
.filter-select {
  width: 130px;
}
.filter-select :deep(.el-input__wrapper) {
  border-radius: 8px;
}

/* ---- 表格 ---- */
.store-table {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
}
.store-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.store-table :deep(.el-table__header th) {
  border-bottom: none !important;
}
.store-table :deep(.el-table__row:hover > td) {
  background-color: var(--el-fill-color-lighter) !important;
}

/* ---- 门店信息单元格 ---- */
.store-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}
.store-cover {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}
.store-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}
.store-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.store-addr {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  display: flex;
  align-items: center;
  gap: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 电话 ---- */
.phone-text {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

/* ---- 营业时间 ---- */
.time-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.time-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
.status-open {
  background: rgba(0, 184, 148, 0.1);
  color: #00b894;
}
.status-open .status-dot {
  background: #00b894;
  box-shadow: 0 0 6px rgba(0, 184, 148, 0.4);
}
.status-closed {
  background: rgba(178, 190, 195, 0.15);
  color: #636e72;
}
.status-closed .status-dot {
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

/* ---- 表单布局 ---- */
.store-form-layout {
  display: flex;
  gap: 24px;
  min-height: 600px;
}
.form-left {
  width: 440px;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  padding-right: 24px;
}
.form-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  height: calc(90vh - 120px);
  overflow-y: auto;
}
.store-form {
  padding: 0 4px;
}
.store-form :deep(.el-form-item) {
  margin-bottom: 24px;
}
.store-form :deep(.el-form-item__label) {
  padding-bottom: 6px;
  font-weight: 500;
}
.store-form :deep(.el-input__wrapper),
.store-form :deep(.el-textarea__inner) {
  border-radius: 8px;
}
.form-row {
  display: flex;
  gap: 16px;
}
.form-item-half {
  flex: 1;
}
.form-item-third {
  flex: 1;
}
.time-range-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

/* ---- 地图区域 ---- */
.map-section {
  flex: 1;
  height: 420px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding: 12px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

/* ---- 照片区域 ---- */
.photo-section {
  flex-shrink: 0;
}
.photo-group {
  margin-top: 12px;
}
.photo-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 10px;
}
.photo-count {
  color: var(--el-text-color-placeholder);
  font-weight: 400;
}
.cover-uploader :deep(.el-upload) {
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
}
.cover-preview {
  position: relative;
  width: 120px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
}
.cover-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}
.cover-preview:hover .cover-mask {
  opacity: 1;
}
.cover-placeholder {
  width: 120px;
  height: 80px;
  border: 2px dashed var(--el-border-color);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  transition: all 0.2s;
}
.cover-placeholder:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.photo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.photo-item {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}
.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-actions {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.photo-item:hover .photo-actions {
  opacity: 1;
}
.photo-action-icon {
  color: #fff;
  font-size: 18px;
  cursor: pointer;
}
.photo-action-icon:hover {
  color: var(--el-color-danger);
}
.photo-uploader :deep(.el-upload) {
  cursor: pointer;
}
.photo-add {
  width: 72px;
  height: 72px;
  border: 2px dashed var(--el-border-color);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  transition: all 0.2s;
}
.photo-add:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* ---- 暗色模式 ---- */
.dark .stat-card {
  background: var(--el-bg-color-overlay);
}
</style>
