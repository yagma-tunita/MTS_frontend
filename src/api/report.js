/*
 * 报表统计模块 — 订单统计、航次利用率
 * 用于数据大屏和管理后台的可视化展示
 */
import request from './request'

/*
 * getOrderStatsApi — 获取订单统计数据
 * GET /api/v1/reports/orders
 * @param {Object} params - { start_date, end_date, group_by, ... }
 * @returns {Promise} - 按时间/状态/港口等维度聚合的订单统计
 */
export function getOrderStatsApi(params) { return request.get('/reports/orders', { params }) }

/*
 * getVoyageUtilizationApi — 获取航次利用率统计
 * GET /api/v1/reports/voyage-utilization
 * @param {Object} params - { start_date, end_date, line_id, ... }
 * @returns {Promise} - 各航线的舱位利用率数据
 */
export function getVoyageUtilizationApi(params) { return request.get('/reports/voyage-utilization', { params }) }
