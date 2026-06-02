<template>
  <div class="map-picker">
    <div class="map-search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索地址"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button icon="Search" @click="handleSearch" />
        </template>
      </el-input>
      <div v-if="searchResults.length" class="search-results">
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
const mapCenter = ref({ lng: 116.404, lat: 39.915 })
const mapZoom = ref(15)
const resolvedAddress = ref('')
let mapInstance = null

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
  mapInstance = map
  // 没有初始位置时，通过 IP 定位到当前位置
  if (!props.modelValue && window.BMapGL) {
    const geolocation = new BMapGL.Geolocation()
    geolocation.getCurrentPosition((result) => {
      if (geolocation.getStatus() === window.BMAP_STATUS_SUCCESS) {
        mapCenter.value = { lng: result.point.lng, lat: result.point.lat }
        mapZoom.value = 15
      }
    }, { enableHighAccuracy: false })
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
  if (!searchText.value.trim()) {
    searchResults.value = []
    return
  }
  if (!window.BMapGL) return

  const geocoder = new BMapGL.Geocoder()
  geocoder.getPoint(searchText.value.trim(), (point) => {
    if (point) {
      searchResults.value = [{
        title: searchText.value.trim(),
        address: '',
        point: { lng: point.lng, lat: point.lat }
      }]
      // 自动选中第一个结果
      selectSearchResult(searchResults.value[0])
    } else {
      searchResults.value = []
    }
  }, '全国')
}

const selectSearchResult = (item) => {
  markerPosition.value = { ...item.point }
  mapCenter.value = { ...item.point }
  mapZoom.value = 17
  searchResults.value = []
  searchText.value = ''
  resolvedAddress.value = item.address || item.title

  emit('update:modelValue', { ...item.point })
  emit('update:address', item.address || item.title)

  if (window.BMapGL) {
    const geocoder = new BMapGL.Geocoder()
    const point = new BMapGL.Point(item.point.lng, item.point.lat)
    geocoder.getLocation(point, (result) => {
      if (result) {
        emit('location-change', {
          lng: item.point.lng,
          lat: item.point.lat,
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
  max-height: 240px;
  overflow-y: auto;
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
