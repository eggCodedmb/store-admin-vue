<template>
  <div class="map-picker">
    <div class="map-search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索地址"
        clearable
        @keyup.enter="handleSearch"
        @clear="searchResults = []"
      >
        <template #append>
          <el-button icon="Search" @click="handleSearch" />
        </template>
      </el-input>
      <div v-if="searchResults.length" class="search-results">
        <el-scrollbar max-height="320px">
          <div
            v-for="(item, index) in searchResults"
            :key="index"
            class="search-result-item"
            @click="selectSearchResult(item)"
          >
            <el-icon><Location /></el-icon>
            <div class="result-info">
              <div class="result-title">{{ item.title }}</div>
              <div class="result-address">{{ item.address }}</div>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>

    <BMap
      :center="mapCenter"
      :zoom="mapZoom"
      :enable-scroll-wheel-zoom="true"
      :width="'100%'"
      :height="'100%'"
      @initd="onMapInitd"
      @click="onMapClick"
    >
      <BZoom anchor="BMAP_ANCHOR_TOP_RIGHT" />
      <BScale anchor="BMAP_ANCHOR_BOTTOM_LEFT" />

      <BMarker
        v-if="markerPosition"
        :position="markerPosition"
        :enable-dragging="true"
        @dragend="onMarkerDragend"
      />
      <BMarker
        v-if="userLocation && locationIcon"
        :position="userLocation"
        :icon="locationIcon"
      />
    </BMap>

    <div v-if="markerPosition" class="map-info-bar">
      <el-tag type="info" effect="plain" size="small">
        经度: {{ markerPosition.lng.toFixed(6) }}
      </el-tag>
      <el-tag type="info" effect="plain" size="small" class="ml-2">
        纬度: {{ markerPosition.lat.toFixed(6) }}
      </el-tag>
      <el-tag v-if="resolvedAddress" effect="plain" size="small" class="ml-2" type="success">
        {{ resolvedAddress }}
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  address: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'update:address', 'location-change'])

const searchText = ref('')
const searchResults = ref([])
const markerPosition = ref(null)
const userLocation = ref(null)
const mapCenter = ref({ lng: 116.404, lat: 39.915 })
const mapZoom = ref(15)
const resolvedAddress = ref('')
let mapInstance = null
const locationIcon = ref(null)

const createLocationIcon = () => {
  if (!window.BMapGL || locationIcon.value) return
  const svg = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">'
    + '<circle cx="12" cy="12" r="8" fill="#409EFF" fill-opacity="0.3"/>'
    + '<circle cx="12" cy="12" r="5" fill="#409EFF" stroke="#fff" stroke-width="2"/>'
    + '</svg>'
  )
  locationIcon.value = new BMapGL.Icon(svg, new BMapGL.Size(24, 24))
}

onMounted(() => {
  if (props.modelValue && props.modelValue.lng && props.modelValue.lat) {
    markerPosition.value = { ...props.modelValue }
    mapCenter.value = { ...props.modelValue }
    mapZoom.value = 17
  }
  if (props.address) {
    resolvedAddress.value = props.address
  }
})

watch(() => props.modelValue, (val) => {
  if (val && val.lng && val.lat) {
    if (!markerPosition.value || markerPosition.value.lng !== val.lng || markerPosition.value.lat !== val.lat) {
      markerPosition.value = { ...val }
      mapCenter.value = { ...val }
    }
  }
}, { deep: true })

const onMapInitd = (map) => {
  try {
    mapInstance = map?.map || map?.getMap?.() || map
  } catch {
    mapInstance = map
  }
  createLocationIcon()
  // IP 定位，显示当前位置蓝点
  if (window.BMapGL) {
    try {
      const geolocation = new BMapGL.Geolocation()
      geolocation.getCurrentPosition((result) => {
        if (geolocation.getStatus() === window.BMAP_STATUS_SUCCESS && result?.point) {
          userLocation.value = { lng: result.point.lng, lat: result.point.lat }
          // 没有初始位置时，以定位为中心
          if (!props.modelValue) {
            mapCenter.value = { lng: result.point.lng, lat: result.point.lat }
            mapZoom.value = 15
          }
        }
      }, { enableHighAccuracy: false })
    } catch {
      // 定位服务不可用时静默忽略
    }
  }
}

const onMapClick = (e) => {
  const { lng, lat } = e.latlng || e.point || e
  if (lng && lat) {
    markerPosition.value = { lng, lat }
    emit('update:modelValue', { lng, lat })
    reverseGeocode(lng, lat)
  }
}

const onMarkerDragend = (e) => {
  const point = e.latlng || e.point || e
  if (point && point.lng && point.lat) {
    markerPosition.value = { lng: point.lng, lat: point.lat }
    emit('update:modelValue', { lng: point.lng, lat: point.lat })
    reverseGeocode(point.lng, point.lat)
  }
}

const reverseGeocode = (lng, lat) => {
  if (!window.BMapGL) return
  const geocoder = new BMapGL.Geocoder()
  const point = new BMapGL.Point(lng, lat)
  geocoder.getLocation(point, (result) => {
    if (result) {
      resolvedAddress.value = result.address
      emit('update:address', result.address)
      emit('location-change', {
        lng,
        lat,
        address: result.address,
        province: result.addressComponents?.province || '',
        city: result.addressComponents?.city || '',
        district: result.addressComponents?.district || '',
      })
    }
  })
}

const handleSearch = () => {
  const keyword = searchText.value.trim()
  if (!keyword) {
    searchResults.value = []
    return
  }
  if (!window.BMapGL) return

  const local = new BMapGL.LocalSearch(mapInstance || '全国', {
    pageCapacity: 10,
    renderOptions: { map: null },
    onSearchComplete: (results) => {
      if (local.getStatus() === window.BMAP_STATUS_SUCCESS && results) {
        const list = []
        const count = Math.min(results.getCurrentNumPois(), 10)
        for (let i = 0; i < count; i++) {
          const poi = results.getPoi(i)
          if (poi && poi.point) {
            list.push({
              title: poi.title || '',
              address: poi.address || '',
              point: { lng: poi.point.lng, lat: poi.point.lat }
            })
          }
        }
        searchResults.value = list
      } else {
        searchResults.value = []
      }
    }
  })
  local.search(keyword)
}

const selectSearchResult = (item) => {
  const point = { ...item.point }
  markerPosition.value = point
  if (mapInstance) {
    const bp = new BMapGL.Point(point.lng, point.lat)
    mapInstance.centerAndZoom(bp, 17)
  } else {
    mapCenter.value = point
    mapZoom.value = 17
  }
  searchResults.value = []
  searchText.value = item.address || item.title
  resolvedAddress.value = item.address || item.title

  emit('update:modelValue', point)
  emit('update:address', item.address || item.title)

  if (window.BMapGL) {
    const geocoder = new BMapGL.Geocoder()
    const bp = new BMapGL.Point(point.lng, point.lat)
    geocoder.getLocation(bp, (result) => {
      if (result) {
        emit('location-change', {
          lng: point.lng,
          lat: point.lat,
          address: result.address,
          province: result.addressComponents?.province || '',
          city: result.addressComponents?.city || '',
          district: result.addressComponents?.district || '',
        })
      }
    })
  }
}
</script>

<style scoped>
.map-picker {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-search-bar {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 10;
  max-width: 400px;
}

.search-results {
  background: var(--el-bg-color, #fff);
  border-radius: 4px;
  margin-top: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-result-item:hover {
  background-color: var(--el-fill-color-light);
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-address {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-info-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-lighter);
}

.ml-2 {
  margin-left: 4px;
}
</style>
