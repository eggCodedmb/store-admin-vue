<template>
  <div class="store-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">门店管理</span>
            <el-input
              v-model="queryParams.keyword"
              placeholder="搜索门店名称/地址"
              clearable
              style="width: 220px; margin-left: 20px"
              @keyup.enter="fetchStores"
              @clear="fetchStores"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="queryParams.status"
              placeholder="门店状态"
              clearable
              style="width: 130px; margin-left: 12px"
              @change="fetchStores"
            >
              <el-option label="营业中" :value="1" />
              <el-option label="已关闭" :value="0" />
            </el-select>
          </div>
          <div class="header-right">
            <el-button icon="MapLocation" @click="mapPreviewVisible = true">地图预览</el-button>
            <el-button type="primary" icon="Plus" @click="handleCreate">新增门店</el-button>
          </div>
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
        <el-table-column label="封面" width="80" align="center">
          <template #default="scope">
            <el-image
              v-if="scope.row.cover"
              :src="formatImageUrl(scope.row.cover)"
              fit="cover"
              class="cover-thumb"
              :preview-src-list="[formatImageUrl(scope.row.cover)]"
              preview-teleported
            />
            <div v-else class="cover-thumb-placeholder">
              <el-icon size="16"><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="门店名称" min-width="140" />
        <el-table-column label="地址" min-width="220" show-overflow-tooltip>
          <template #default="scope">
            {{ formatFullAddress(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column label="营业时间" min-width="180">
          <template #default="scope">
            <div class="time-tags">
              <el-tag
                v-for="item in parseBusinessHours(scope.row.business_hours)"
                :key="item"
                size="small"
                type="info"
                effect="plain"
                class="time-tag"
              >{{ item }}</el-tag>
              <span v-if="!parseBusinessHours(scope.row.business_hours).length" class="text-muted">未设置</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 1 ? 'success' : 'info'"
              effect="dark"
              round
            >
              {{ scope.row.status === 1 ? '营业中' : '已关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" align="center">
          <template #default="scope">
            {{ formatTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
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

    <!-- 新增/编辑 Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增门店' : '编辑门店'"
      width="1280px"
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
                <el-input v-model="storeForm.name" placeholder="请输入门店名称" maxlength="50" show-word-limit />
              </el-form-item>

              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="联系电话">
                    <el-input v-model="storeForm.phone" placeholder="请输入联系电话" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="门店状态">
                    <el-switch
                      v-model="storeForm.status"
                      :active-value="1"
                      :inactive-value="0"
                      active-text="营业中"
                      inactive-text="已关闭"
                      inline-prompt
                    />
                  </el-form-item>
                </el-col>
              </el-row>

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
                    link
                    icon="Delete"
                    @click="removeTimeRange(index)"
                  />
                </div>
                <el-button type="primary" link icon="Plus" @click="addTimeRange" class="mt-2">添加时间段</el-button>
              </el-form-item>

              <el-form-item label="详细地址">
                <el-input v-model="storeForm.address" placeholder="地图选点后自动回填，也可手动输入" />
              </el-form-item>

              <el-row :gutter="16">
                <el-col :span="8">
                  <el-form-item label="省">
                    <el-input v-model="storeForm.province" placeholder="省" disabled />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="市">
                    <el-input v-model="storeForm.city" placeholder="市" disabled />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="区/县">
                    <el-input v-model="storeForm.district" placeholder="区/县" disabled />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="门店描述">
                <el-input v-model="storeForm.description" type="textarea" :rows="3" placeholder="请输入门店描述" maxlength="200" show-word-limit />
              </el-form-item>
            </el-form>
          </el-scrollbar>
        </div>

        <!-- 右侧：地图 + 照片 -->
        <div class="form-right">
          <div class="map-section">
            <div class="section-title">
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
            <div class="section-title">
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
                  <img :src="formatImageUrl(storeForm.cover)" class="cover-img" />
                  <div class="cover-mask">
                    <el-icon><Edit /></el-icon>
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
              <div class="photo-label">门店相册 <span class="photo-count">({{ storeForm.photos.length }}/9)</span></div>
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
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ dialogType === 'create' ? '创建门店' : '保存修改' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 地图预览 Dialog -->
    <el-dialog
      v-model="mapPreviewVisible"
      title="门店地图预览"
      fullscreen
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
  name: [
    { required: true, message: '请输入门店名称', trigger: 'blur' }
  ]
}

const token = localStorage.getItem('token')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${token}`
}))

const formatImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return baseURL + url
}

const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const formatFullAddress = (row) => {
  const parts = [row.province, row.city, row.district, row.address].filter(Boolean)
  return parts.length ? parts.join(' ') : '-'
}

const parseBusinessHours = (str) => {
  if (!str) return []
  try {
    return JSON.parse(str)
  } catch {
    return [str]
  }
}

const beforeImageUpload = (file) => {
  const isImage = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传 JPG/PNG/WebP 格式图片')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

const handleCoverSuccess = (response) => {
  if (response.code === 0) {
    storeForm.cover = response.result.url
  }
}

const handlePhotoSuccess = (response) => {
  if (response.code === 0 && storeForm.photos.length < 9) {
    storeForm.photos.push(response.result.url)
  }
}

const removePhoto = (index) => {
  storeForm.photos.splice(index, 1)
}

const onLocationChange = ({ lng, lat, address, province, city, district }) => {
  storeForm.address = address || storeForm.address
  storeForm.province = province || ''
  storeForm.city = city || ''
  storeForm.district = district || ''
}

const addTimeRange = () => {
  storeForm.business_hours_list.push(['08:00', '22:00'])
}

const removeTimeRange = (index) => {
  storeForm.business_hours_list.splice(index, 1)
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

    // 解析营业时间
    const ranges = parseBusinessHours(data.business_hours)
    storeForm.business_hours_list = ranges.map(r => r.split('-'))
    if (storeForm.business_hours_list.length === 0) {
      storeForm.business_hours_list = [['08:00', '22:00']]
    }

    // 照片
    storeForm.photos = (data.photos || []).map(p => p.url)

    // 地图坐标
    if (data.longitude && data.latitude) {
      mapCoords.value = { lng: Number(data.longitude), lat: Number(data.latitude) }
    }

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

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  fetchStores()
}

const handleCurrentChange = (val) => {
  queryParams.pageNum = val
  fetchStores()
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
  ElMessageBox.confirm(`确定要删除门店「${row.name}」吗？删除后不可恢复。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteStore(row.id)
      ElMessage.success('门店删除成功')
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
  padding: 24px;
  background-color: var(--el-bg-color-page);
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.table-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.cover-thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
}

.cover-thumb-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  margin: 0 auto;
}

.time-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.time-tag {
  margin: 0;
}

.text-muted {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* Dialog 布局 */
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

.time-range-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.mt-2 {
  margin-top: 4px;
}

/* 地图区域 */
.map-section {
  flex: 1;
  height: 420px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

/* 照片区域 */
.photo-section {
  flex-shrink: 0;
}

.photo-group {
  margin-top: 10px;
}

.photo-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.photo-count {
  color: var(--el-text-color-placeholder);
  font-weight: 400;
}

/* 封面上传 */
.cover-uploader :deep(.el-upload) {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
}

.cover-preview {
  position: relative;
  width: 120px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
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
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  transition: border-color 0.2s;
}

.cover-placeholder:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

/* 相册 */
.photo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.photo-item {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 6px;
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
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  transition: border-color 0.2s;
}

.photo-add:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
</style>
