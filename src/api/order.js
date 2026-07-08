/*
 * 订单模块 — 订单 CRUD、跟踪、支付、航次推荐
 * 与后端 Order / VoyageRecommend 相关接口交互
 */
import request from './request'

/*
 * createOrderApi — 创建新订单
 * POST /api/v1/orders
 * @param {Object} data - { shipper_company_id, city_id, line_id, vessel_id, voyage_date, cargo_items }
 */
export function createOrderApi(data) { return request.post('/orders', data) }

/*
 * getOrderListApi — 获取订单列表（分页+筛选）
 * GET /api/v1/orders
 * @param {Object} params - { page, page_size, order_status, keyword, ... }
 * @returns {Promise} - res.data 为数组，res.meta 含分页信息
 */
export function getOrderListApi(params) { return request.get('/orders', { params }) }

/*
 * getOrderDetailApi — 获取订单详情
 * GET /api/v1/orders/:id
 * @param {number|string} id - 订单 ID
 * @returns {Promise} - 含 departure_port, destination_port, order_cargos 等嵌套对象
 */
export function getOrderDetailApi(id) { return request.get(`/orders/${id}`) }

/*
 * cancelOrderApi — 取消订单
 * POST /api/v1/orders/:id/cancel
 * @param {number|string} id - 订单 ID
 */
export function cancelOrderApi(id) { return request.post(`/orders/${id}/cancel`) }

/*
 * updateOrderStatusApi — 更新订单状态
 * PUT /api/v1/orders/:id/status
 * @param {number|string} id - 订单 ID
 * @param {Object} data - { status: number }（0=草稿,1=已确认,2=运输中,3=已完成,4=已取消）
 */
export function updateOrderStatusApi(id, data) { return request.put(`/orders/${id}/status`, data) }

/*
 * getOrderTrackingApi — 获取订单物流跟踪信息
 * GET /api/v1/orders/:id/tracking
 * @param {number|string} id - 订单 ID
 */
export function getOrderTrackingApi(id) { return request.get(`/orders/${id}/tracking`) }

/*
 * payOrderApi — 支付订单
 * POST /api/v1/orders/:id/pay
 * @param {number|string} id - 订单 ID
 */
export function payOrderApi(id) { return request.post(`/orders/${id}/pay`) }

/*
 * getVoyageRecommendApi — 获取航次推荐列表
 * GET /api/v1/voyages/recommend
 * @param {Object} params - 筛选参数（起止港、日期等）
 * @returns {Promise} - 返回 VoyageRecommend 列表（LineID, VesselID, VesselName, LineName 等 PascalCase 字段）
 */
export function getVoyageRecommendApi(params) { return request.get('/voyages/recommend', { params }) }
