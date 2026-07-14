import gcoord from 'gcoord'

/**
 * 百度坐标系 (BD-09) 转换为 火星坐标系 (GCJ-02)
 * @param {number} bd_lon 百度经度
 * @param {number} bd_lat 百度纬度
 * @returns {object} { lng, lat } 火星坐标
 */
export function bd09togcj02(bd_lon, bd_lat) {
  const result = gcoord.transform(
    [Number(bd_lon), Number(bd_lat)],
    gcoord.BD09,
    gcoord.GCJ02
  )
  return { lng: result[0], lat: result[1] }
}

/**
 * 火星坐标系 (GCJ-02) 转换为 百度坐标系 (BD-09)
 * @param {number} lng 火星经度
 * @param {number} lat 火星纬度
 * @returns {object} { lng, lat } 百度坐标
 */
export function gcj02tobd09(lng, lat) {
  const result = gcoord.transform(
    [Number(lng), Number(lat)],
    gcoord.GCJ02,
    gcoord.BD09
  )
  return { lng: result[0], lat: result[1] }
}
