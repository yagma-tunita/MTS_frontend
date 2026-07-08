/*
 * 基础数据模块 — 城市、港口、船舶、航线、船公司等参考数据查询
 * 大部分为 GET 请求，用于前端下拉框/选择器/详情展示
 */
import request from './request'

/*
 * getCityListApi — 获取城市列表
 * GET /api/v1/cities
 * @param {Object} params - { page, page_size, keyword, ... }
 */
export function getCityListApi(params) { return request.get('/cities', { params }) }

/*
 * getPortListApi — 获取港口列表
 * GET /api/v1/ports
 * @param {Object} params - { page, page_size, city_id, keyword, ... }
 */
export function getPortListApi(params) { return request.get('/ports', { params }) }

/*
 * getPortDetailApi — 获取港口详情（含关联城市信息）
 * GET /api/v1/ports/:id
 * @param {number|string} id - 港口 ID
 * @returns {Promise} - 含 port_code, city: { city_name, country } 等字段
 */
export function getPortDetailApi(id) { return request.get(`/ports/${id}`) }

/*
 * getVesselListApi — 获取船舶列表
 * GET /api/v1/vessels
 * @param {Object} params - { page, page_size, shipping_company_id, keyword, ... }
 */
export function getVesselListApi(params) { return request.get('/vessels', { params }) }

/*
 * getVesselDetailApi — 获取船舶详情
 * GET /api/v1/vessels/:id
 * @param {number|string} id - 船舶 ID
 * @returns {Promise} - 含 imo_number, call_sign, container_teu 等详细参数
 */
export function getVesselDetailApi(id) { return request.get(`/vessels/${id}`) }

/*
 * getLineListApi — 获取航线列表
 * GET /api/v1/shipping-lines
 * @param {Object} params - { page, page_size, departure_port_id, destination_port_id, ... }
 */
export function getLineListApi(params) { return request.get('/shipping-lines', { params }) }

/*
 * getLineDetailApi — 获取航线详情
 * GET /api/v1/shipping-lines/:id
 * @param {number|string} id - 航线 ID
 */
export function getLineDetailApi(id) { return request.get(`/shipping-lines/${id}`) }

/*
 * getLinePortSequenceApi — 获取航线的港口顺序
 * GET /api/v1/shipping-lines/:id/port-sequence
 * @param {number|string} id - 航线 ID
 * @returns {Promise} - { port_sequence: [1, 2, 3] }（港口 ID 数组）
 */
export function getLinePortSequenceApi(id) { return request.get(`/shipping-lines/${id}/port-sequence`) }

/*
 * getShippingCompanyListApi — 获取船公司列表
 * GET /api/v1/shipping-companies
 * @param {Object} params - { page, page_size, keyword, ... }
 */
export function getShippingCompanyListApi(params) { return request.get('/shipping-companies', { params }) }
