/**
 * 图标集配置
 * 定义可用的 Iconify 图标集列表，供图标选择器使用
 */
export const iconCollections = [
  { prefix: 'ep', name: 'Element Plus', total: 334 },
  { prefix: 'mdi', name: 'Material Design', total: 7497 },
  { prefix: 'fa6', name: 'Font Awesome 6', total: 2044 },
  { prefix: 'heroicons', name: 'Heroicons', total: 924 },
  { prefix: 'tabler', name: 'Tabler Icons', total: 5878 },
  { prefix: 'carbon', name: 'Carbon', total: 2196 },
  { prefix: 'lucide', name: 'Lucide', total: 1542 },
]

// 图标集图标列表缓存
const iconsCache = {}

/**
 * 获取指定图标集的图标名列表
 * 通过 Iconify Collection API 获取，结果会缓存
 * @param {string} prefix 图标集前缀，如 'mdi'
 * @returns {Promise<string[]>} 图标名列表（不含前缀）
 */
export async function fetchIconsByPrefix(prefix) {
  if (iconsCache[prefix]) {
    return iconsCache[prefix]
  }

  try {
    const resp = await fetch(`https://api.iconify.design/collection?prefix=${prefix}`)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()

    // 合并 uncategorized 和 categories 中的所有图标名
    const names = [...(data.uncategorized || [])]
    if (data.categories) {
      for (const icons of Object.values(data.categories)) {
        names.push(...icons)
      }
    }

    iconsCache[prefix] = names
    return names
  } catch (err) {
    console.error(`[IconPicker] Failed to load icons for ${prefix}:`, err)
    return []
  }
}

/**
 * 格式化完整的图标标识符
 * @param {string} prefix 图标集前缀
 * @param {string} name 图标名
 * @returns {string} 如 'mdi:home'
 */
export function formatIconName(prefix, name) {
  return `${prefix}:${name}`
}
