import request from '../utils/request'

/**
 * 获取概览统计数据
 * 包括：总商品数、今日订单、活跃用户、月销售额
 */
export function getSummary() {
  return request({
    url: '/tj/summary',
    method: 'get'
  })
}

/**
 * 获取用户统计数据 (按时间范围)
 */
export function getUserStats(data) {
  return request({
    url: '/tj/user-count',
    method: 'post',
    data
  })
}

/**
 * 获取销售趋势数据
 */
export function getSalesTrend(params) {
  return request({
    url: '/tj/sales-trend',
    method: 'get',
    params
  })
}

/**
 * 获取分类分布数据
 */
export function getCategoryDistribution() {
  return request({
    url: '/tj/category-distribution',
    method: 'get'
  })
}
