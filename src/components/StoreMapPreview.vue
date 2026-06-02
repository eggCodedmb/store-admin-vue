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
          <div class="store-info-window">
            <div class="info-header">
              <strong>{{ store.name }}</strong>
              <el-tag
                :type="store.status === 1 ? 'success' : 'info'"
                size="small"
                effect="dark"
                style="margin-left: 8px"
              >
                {{ store.status === 1 ? '营业中' : '已关闭' }}
              </el-tag>
            </div>
            <p class="info-address">{{ store.address || '暂无地址' }}</p>
            <p v-if="store.phone" class="info-phone">📞 {{ store.phone }}</p>
            <p v-if="store.province || store.city" class="info-location">
              📍 {{ store.province }}{{ store.city }}{{ store.district }}
            </p>
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

.store-info-window {
  font-size: 13px;
  line-height: 1.8;
  min-width: 200px;
}

.info-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.info-address {
  color: #666;
  margin: 0;
}

.info-phone {
  color: #333;
  margin: 0;
}

.info-location {
  color: #999;
  margin: 0;
  font-size: 12px;
}
</style>
