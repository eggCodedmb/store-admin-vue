<template>
  <div ref="chartRef" :style="{ height, width }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, onActivated, onDeactivated, computed } from 'vue'
import * as echarts from 'echarts'
import { useEventListener, useResizeObserver, useDark } from '@vueuse/core'

const props = defineProps({
  option: {
    type: Object,
    required: true
  },
  height: {
    type: String,
    default: '350px'
  },
  width: {
    type: String,
    default: '100%'
  }
})

const isDark = useDark()
const theme = computed(() => isDark.value ? 'dark' : '')

const chartRef = ref(null)
let chart = null

const initChart = () => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value, theme.value)
  chart.setOption(props.option)
}

const resizeHandler = () => {
  chart?.resize()
}

// Watch for theme changes
watch(theme, () => {
  if (chart) {
    chart.dispose()
    initChart()
  }
})

// Watch for option changes
watch(
  () => props.option,
  (newOption) => {
    if (chart) {
      chart.setOption(newOption, true)
    }
  },
  { deep: true }
)

// Handle window resize
useEventListener(window, 'resize', resizeHandler)

// Handle element resize (useful if the chart is in a container that changes size)
useResizeObserver(chartRef, resizeHandler)

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  if (!chart) return
  chart.dispose()
  chart = null
})

// Support for keep-alive
onActivated(() => {
  chart?.resize()
})

onDeactivated(() => {
  // Optional cleanup
})

// Expose chart instance for advanced usage
defineExpose({
  getInstance: () => chart
})
</script>
