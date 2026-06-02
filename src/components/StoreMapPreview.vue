<template>
  <div class="store-map-preview">
    <div class="map-toolbar">
      <el-input
        v-model="citySearch"
        placeholder="输入城市名称跳转"
        clearable
        style="width: 240px"
        @keyup.enter="goToCity"
      >
        <template #append>
          <el-button icon="Search" @click="goToCity" />
        </template>
      </el-input>
      <div class="toolbar-info">
        <el-tag effect="dark" type="primary">共 {{ storeList.length }} 家门店</el-tag>
      </div>
    </div>

    <BMap
      :center="mapCenter"
      :zoom="mapZoom"
      :enable-scroll-wheel-zoom="true"
      :width="'100%'"
      :height="'100%'"
      mapType="BMAP_NORMAL_MAP"
      @initd="onMapInitd"
    >
      <BZoom anchor="BMAP_ANCHOR_TOP_RIGHT" />
      <BScale anchor="BMAP_ANCHOR_BOTTOM_LEFT" />

      <template v-for="store in storeList" :key="store.id">
        <BMarker
          :position="{ lng: Number(store.longitude), lat: Number(store.latitude) }"
          @click="openInfoWindow(store)"
        />
        <BInfoWindow
          :position="{ lng: Number(store.longitude), lat: Number(store.latitude) }"
          :show="activeStoreId === store.id"
          @close="activeStoreId = null"
        >
          <div class="info-card">
            <div class="info-card-cover" v-if="store.cover">
              <img :src="formatImageUrl(store.cover)" class="info-card-img" />
              <div class="info-card-cover-overlay"></div>
              <span class="info-card-badge" :class="store.status === 1 ? 'badge-open' : 'badge-closed'">
                <span class="badge-dot"></span>
                {{ store.status === 1 ? '营业中' : '已关闭' }}
              </span>
            </div>
            <div v-else class="info-card-cover info-card-cover--empty">
              <svg class="cover-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              <span class="info-card-badge" :class="store.status === 1 ? 'badge-open' : 'badge-closed'">
                <span class="badge-dot"></span>
                {{ store.status === 1 ? '营业中' : '已关闭' }}
              </span>
            </div>
            <div class="info-card-body">
              <h3 class="info-card-name">{{ store.name }}</h3>
              <div class="info-card-row">
                <svg class="info-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span class="info-card-text">{{ store.address || '暂无地址' }}</span>
              </div>
              <div v-if="store.phone" class="info-card-row">
                <svg class="info-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span class="info-card-text">{{ store.phone }}</span>
              </div>
            </div>
          </div>
        </BInfoWindow>
      </template>
    </BMap>

    <div v-if="storeList.length" class="store-sidebar">
      <el-scrollbar max-height="100%">
        <div
          v-for="store in storeList"
          :key="store.id"
          class="sidebar-store-item"
          :class="{ active: activeStoreId === store.id }"
          @click="focusStore(store)"
        >
          <el-image
            v-if="store.cover"
            :src="formatImageUrl(store.cover)"
            fit="cover"
            class="store-thumb"
          />
          <div v-else class="store-thumb-placeholder">
            <el-icon size="20"><Shop /></el-icon>
          </div>
          <div class="store-meta">
            <div class="store-name">{{ store.name }}</div>
            <div class="store-addr">{{ store.address || '暂无地址' }}</div>
          </div>
          <el-tag
            :type="store.status === 1 ? 'success' : 'info'"
            size="small"
            effect="plain"
          >
            {{ store.status === 1 ? '营业' : '关闭' }}
          </el-tag>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getStoreMapList } from '../api/store'
import { baseURL } from '../utils/request'

const storeList = ref([])
const mapCenter = ref({ lng: 116.404, lat: 39.915 })
const mapZoom = ref(11)
const citySearch = ref('')
const activeStoreId = ref(null)
let mapInstance = null

const formatImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return baseURL + url
}

const getRawMap = (map) => {
  // vue3-baidu-map-gl @initd 回调传入的是包装对象，需要取内部原生 BMapGL.Map
  return map?.map || map?.getMap?.() || map
}

const onMapInitd = (map) => {
  const rawMap = getRawMap(map)
  mapInstance = rawMap
  // 先 IP 定位，再加载门店数据
  if (window.BMapGL) {
    const geolocation = new BMapGL.Geolocation()
    geolocation.getCurrentPosition((result) => {
      if (geolocation.getStatus() === window.BMAP_STATUS_SUCCESS) {
        mapCenter.value = { lng: result.point.lng, lat: result.point.lat }
        mapZoom.value = 12
      }
      // 无论定位成功与否，都加载门店并 fit 视口
      fetchStores()
    }, { enableHighAccuracy: false })
  } else {
    fetchStores()
  }
}

const fetchStores = async () => {
  try {
    const res = await getStoreMapList()
    storeList.value = res.result || []
    if (storeList.value.length > 0 && mapInstance) {
      const points = storeList.value
        .filter(s => s.longitude && s.latitude)
        .map(s => new BMapGL.Point(Number(s.longitude), Number(s.latitude)))
      if (points.length > 0) {
        if (typeof mapInstance.setViewport === 'function') {
          mapInstance.setViewport(points)
        } else if (typeof mapInstance.fitView === 'function') {
          mapInstance.fitView(points)
        }
      }
    }
  } catch (error) {
    console.error('获取地图门店数据失败:', error)
  }
}

const goToCity = () => {
  if (!citySearch.value.trim() || !mapInstance) return
  mapInstance.centerAndZoom(citySearch.value.trim(), 12)
}

const openInfoWindow = (store) => {
  activeStoreId.value = store.id
}

const focusStore = (store) => {
  activeStoreId.value = store.id
  if (mapInstance && store.longitude && store.latitude) {
    const point = new BMapGL.Point(Number(store.longitude), Number(store.latitude))
    mapInstance.centerAndZoom(point, 17)
  }
}

</script>

<style scoped>
.store-map-preview {
  position: relative;
  width: 100%;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.toolbar-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.store-sidebar {
  position: absolute;
  top: 60px;
  left: 12px;
  width: 280px;
  max-height: calc(100% - 80px);
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 10;
}

.sidebar-store-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sidebar-store-item:hover,
.sidebar-store-item.active {
  background-color: var(--el-fill-color-light);
}

.store-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  flex-shrink: 0;
}

.store-thumb-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  flex-shrink: 0;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
}

.store-meta {
  flex: 1;
  min-width: 0;
}

.store-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-addr {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-card {
  width: 280px;
  margin: -8px -10px;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.info-card-cover {
  position: relative;
  width: 100%;
  height: 130px;
  overflow: hidden;
}

.info-card-cover--empty {
  background: linear-gradient(135deg, #e8edf2 0%, #d5dce4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-empty-icon {
  width: 36px;
  height: 36px;
  color: #b0bac5;
}

.info-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.info-card-cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.15));
  pointer-events: none;
}

.info-card-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 20px;
  color: #fff;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 4px currentColor;
}

.badge-open {
  background: rgba(103, 194, 58, 0.85);
}

.badge-closed {
  background: rgba(144, 147, 153, 0.85);
}

.info-card-body {
  padding: 12px 14px 14px;
}

.info-card-name {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-card-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: #8c939d;
  line-height: 1.5;
}

.info-card-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  margin-top: 1px;
  color: #b0bac5;
}

.info-card-text {
  flex: 1;
  min-width: 0;
  word-break: break-all;
}
</style>
