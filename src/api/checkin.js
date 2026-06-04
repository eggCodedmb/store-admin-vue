import request from '../utils/request'

// 获取签到奖励配置
export function getCheckinRewards() {
  return request({ url: '/checkin/rewards', method: 'get' })
}

// 批量更新签到奖励配置
export function updateCheckinRewards(data) {
  return request({ url: '/checkin/rewards', method: 'put', data })
}

// 获取签到记录列表（分页）
export function getCheckinRecords(params) {
  return request({ url: '/checkin/records', method: 'get', params })
}
