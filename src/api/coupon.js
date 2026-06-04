import request from '../utils/request'

// 查询优惠券模板列表
export function getCouponTemplateList(params) {
  return request({ url: '/coupon/template', method: 'get', params })
}

// 查询单个模板详情
export function getCouponTemplateDetail(id) {
  return request({ url: `/coupon/template/${id}`, method: 'get' })
}

// 创建优惠券模板
export function createCouponTemplate(data) {
  return request({ url: '/coupon/template', method: 'post', data })
}

// 更新优惠券模板
export function updateCouponTemplate(id, data) {
  return request({ url: `/coupon/template/${id}`, method: 'put', data })
}

// 停用优惠券模板
export function deleteCouponTemplate(id) {
  return request({ url: `/coupon/template/${id}`, method: 'delete' })
}

// 查看某模板的领取/使用记录
export function getCouponRecords(id, params) {
  return request({ url: `/coupon/template/${id}/records`, method: 'get', params })
}
