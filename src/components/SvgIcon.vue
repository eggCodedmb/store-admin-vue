<template>
  <!-- Iconify 图标：prefix:name 格式 -->
  <span v-if="isIconify" class="svg-icon-wrapper" :style="{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: sizeValue + 'px', height: sizeValue + 'px' }">
    <IconifyIcon
      v-if="iconLoaded"
      :icon="icon"
      :width="sizeValue"
      :height="sizeValue"
      :color="color || 'currentColor'"
      :style="iconStyle"
    />
    <!-- 加载中 / 失败回退：显示图标名缩写 -->
    <span v-else class="svg-icon-fallback" :style="{ fontSize: Math.max(sizeValue * 0.4, 10) + 'px', color: color || 'inherit', lineHeight: 1 }">
      {{ fallbackText }}
    </span>
  </span>
  <!-- Element Plus 图标兼容模式：纯名称格式 -->
  <el-icon v-else :size="size" :color="color" :style="iconStyle">
    <component :is="icon" />
  </el-icon>
</template>

<script setup>
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import { Icon as IconifyIcon, loadIcons, getIcon } from '@iconify/vue'

const props = defineProps({
  /** 图标名称，支持 'prefix:name'（Iconify）或纯名称（Element Plus） */
  icon: {
    type: String,
    required: true,
  },
  /** 图标尺寸，单位 px */
  size: {
    type: [Number, String],
    default: 16,
  },
  /** 图标颜色 */
  color: {
    type: String,
    default: '',
  },
})

/** 判断是否为 Iconify 格式（包含冒号） */
const isIconify = computed(() => props.icon.includes(':'))

/** 统一的尺寸数值 */
const sizeValue = computed(() => Number(props.size) || 16)

/** 图标是否已加载 */
const iconLoaded = ref(false)
let cancelLoad = null

/** 加载图标数据 */
function checkAndLoadIcon(iconName) {
  // 清理上一次加载
  if (cancelLoad) {
    cancelLoad()
    cancelLoad = null
  }

  if (!iconName || !iconName.includes(':')) {
    iconLoaded.value = false
    return
  }

  // 检查是否已缓存
  if (getIcon(iconName)) {
    iconLoaded.value = true
    return
  }

  // 标记为未加载，触发 API 请求
  iconLoaded.value = false
  cancelLoad = loadIcons([iconName], (loaded) => {
    if (loaded.length > 0) {
      iconLoaded.value = true
    }
  })
}

// 监听 icon 变化
watch(() => props.icon, checkAndLoadIcon, { immediate: true })

onUnmounted(() => {
  if (cancelLoad) {
    cancelLoad()
    cancelLoad = null
  }
})

/** 回退文本：取图标名的前2个字符大写 */
const fallbackText = computed(() => {
  if (!props.icon) return ''
  const name = props.icon.split(':')[1] || props.icon
  return name.slice(0, 2).toUpperCase()
})

/** 基础样式 */
const iconStyle = computed(() => {
  const style = {}
  if (!props.color) {
    style.color = 'inherit'
  }
  return style
})
</script>

<style scoped>
.svg-icon-wrapper {
  flex-shrink: 0;
}
.svg-icon-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  opacity: 0.5;
  user-select: none;
}
</style>
