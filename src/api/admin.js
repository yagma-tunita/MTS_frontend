/*
 * 管理员模块 — 用户管理、港口/船舶/航线/货物/城市 CRUD
 * 所有接口需要 admin 角色权限，令牌由请求拦截器自动注入
 */
import request from './request'

/* ==================== 管理员自身 ==================== */

/*
 * getAdminListApi — 获取管理员列表
 * GET /api/v1/admin/list
 * @param {Object} params - 分页参数 { page, page_size }
 */
export function getAdminListApi(params) { return request.get('/admin/list', { params }) }

/*
 * adminRegisterApi — 创建管理员账号
 * POST /api/v1/admin/register
 * @param {Object} data - { username, password, ... }
 */
export function adminRegisterApi(data) { return request.post('/admin/register', data) }

/*
 * adminChangePasswordApi — 管理员修改密码
 * POST /api/v1/admin/password/:id
 * @param {number|string} id - 管理员 ID
 * @param {Object} data - { old_password, new_password }
 */
export function adminChangePasswordApi(id, data) { return request.post(`/admin/password/${id}`, data) }

/* ==================== 货主管理 ==================== */

/*
 * getShipperListApi — 获取货主列表
 * GET /api/v1/admin/shipper/list
 * @param {Object} params - 分页与筛选参数
 */
export function getShipperListApi(params) { return request.get('/admin/shipper/list', { params }) }

/*
 * updateShipperApi — 更新货主信息
 * POST /api/v1/admin/shipper/:id/update
 * @param {number|string} id - 货主 ID
 * @param {Object} data - 要更新的字段
 */
export function updateShipperApi(id, data) { return request.post(`/admin/shipper/${id}/update`, data) }

/*
 * deleteShipperApi — 删除货主
 * POST /api/v1/admin/shipper/:id/delete
 * @param {number|string} id - 货主 ID
 */
export function deleteShipperApi(id) { return request.post(`/admin/shipper/${id}/delete`) }

/* ==================== 船公司管理 ==================== */

/*
 * getShippingListApi — 获取船公司列表
 * GET /api/v1/admin/shipping/list
 * @param {Object} params - 分页与筛选参数
 */
export function getShippingListApi(params) { return request.get('/admin/shipping/list', { params }) }

/*
 * updateShippingApi — 更新船公司信息
 * POST /api/v1/admin/shipping/:id/update
 * @param {number|string} id - 船公司 ID
 * @param {Object} data - 要更新的字段
 */
export function updateShippingApi(id, data) { return request.post(`/admin/shipping/${id}/update`, data) }

/*
 * deleteShippingApi — 删除船公司
 * POST /api/v1/admin/shipping/:id/delete
 * @param {number|string} id - 船公司 ID
 */
export function deleteShippingApi(id) { return request.post(`/admin/shipping/${id}/delete`) }

/* ==================== 港口管理 ==================== */

/*
 * createPortApi — 创建港口
 * POST /api/v1/admin/ports
 * @param {Object} data - { port_name, port_code, city_id, ... }
 */
export function createPortApi(data) { return request.post('/admin/ports', data) }

/*
 * updatePortApi — 更新港口
 * PUT /api/v1/admin/ports/:id
 * @param {number|string} id - 港口 ID
 * @param {Object} data - 要更新的字段
 */
export function updatePortApi(id, data) { return request.put(`/admin/ports/${id}`, data) }

/*
 * deletePortApi — 删除港口
 * DELETE /api/v1/admin/ports/:id
 * @param {number|string} id - 港口 ID
 */
export function deletePortApi(id) { return request.delete(`/admin/ports/${id}`) }

/* ==================== 船舶管理 ==================== */

/*
 * createVesselApi — 创建船舶
 * POST /api/v1/admin/vessels
 * @param {Object} data - { vessel_name, imo_number, call_sign, shipping_company_id, container_teu, ... }
 */
export function createVesselApi(data) { return request.post('/admin/vessels', data) }

/*
 * updateVesselApi — 更新船舶
 * PUT /api/v1/admin/vessels/:id
 * @param {number|string} id - 船舶 ID
 * @param {Object} data - 要更新的字段
 */
export function updateVesselApi(id, data) { return request.put(`/admin/vessels/${id}`, data) }

/*
 * deleteVesselApi — 删除船舶
 * DELETE /api/v1/admin/vessels/:id
 * @param {number|string} id - 船舶 ID
 */
export function deleteVesselApi(id) { return request.delete(`/admin/vessels/${id}`) }

/* ==================== 航线管理 ==================== */

/*
 * createLineApi — 创建航线
 * POST /api/v1/admin/shipping-lines
 * @param {Object} data - { line_name, departure_port_id, destination_port_id, total_distance_nm, port_sequence, ... }
 */
export function createLineApi(data) { return request.post('/admin/shipping-lines', data) }

/*
 * updateLineApi — 更新航线
 * PUT /api/v1/admin/shipping-lines/:id
 * @param {number|string} id - 航线 ID
 * @param {Object} data - 要更新的字段
 */
export function updateLineApi(id, data) { return request.put(`/admin/shipping-lines/${id}`, data) }

/*
 * deleteLineApi — 删除航线
 * DELETE /api/v1/admin/shipping-lines/:id
 * @param {number|string} id - 航线 ID
 */
export function deleteLineApi(id) { return request.delete(`/admin/shipping-lines/${id}`) }

/* ==================== 货物管理 ==================== */

/*
 * getCargoListApi — 获取货物类型列表
 * GET /api/v1/admin/cargo/list
 * @param {Object} params - 分页参数
 */
export function getCargoListApi(params) { return request.get('/admin/cargo/list', { params }) }

/*
 * createCargoApi — 创建货物类型
 * POST /api/v1/admin/cargo/create
 * @param {Object} data - 货物类型信息
 */
export function createCargoApi(data) { return request.post('/admin/cargo/create', data) }

/*
 * deleteCargoApi — 删除货物类型
 * DELETE /api/v1/admin/cargo/:id
 * @param {number|string} id - 货物类型 ID
 */
export function deleteCargoApi(id) { return request.delete(`/admin/cargo/${id}`) }

/* ==================== 航线审核 ==================== */

/*
 * getPendingLinesApi — 获取待审核航线列表
 * GET /api/v1/admin/shipping-lines/pending
 * @param {Object} params - 分页参数
 */
export function getPendingLinesApi(params) { return request.get('/admin/shipping-lines/pending', { params }) }

/*
 * approveLineApi — 审核通过航线
 * POST /api/v1/admin/shipping-lines/:id/approve
 * @param {number|string} id - 航线 ID
 */
export function approveLineApi(id) { return request.post(`/admin/shipping-lines/${id}/approve`) }

/*
 * deprecateLineApi — 废弃/驳回航线
 * POST /api/v1/admin/shipping-lines/:id/deprecate
 * @param {number|string} id - 航线 ID
 */
export function deprecateLineApi(id) { return request.post(`/admin/shipping-lines/${id}/deprecate`) }

/* ==================== 城市管理 ==================== */

/* ==================== 货物类型管理 ==================== */

/*
 * getCargoTypeListApi — 获取货物类型列表（分页）
 * GET /api/v1/admin/cargo-types
 */
export function getCargoTypeManageListApi(params) { return request.get('/admin/cargo-types', { params }) }

/*
 * createCargoTypeApi — 创建货物类型
 * POST /api/v1/admin/cargo-types
 */
export function createCargoTypeApi(data) { return request.post('/admin/cargo-types', data) }

/*
 * updateCargoTypeApi — 更新货物类型
 * PUT /api/v1/admin/cargo-types/:id
 */
export function updateCargoTypeApi(id, data) { return request.put(`/admin/cargo-types/${id}`, data) }

/*
 * deleteCargoTypeApi — 删除货物类型
 * DELETE /api/v1/admin/cargo-types/:id
 */
export function deleteCargoTypeApi(id) { return request.delete(`/admin/cargo-types/${id}`) }

/*
 * createCityApi — 创建城市
 * POST /api/v1/admin/cities
 * @param {Object} data - { city_name, country, ... }
 */
export function createCityApi(data) { return request.post('/admin/cities', data) }

/*
 * updateCityApi — 更新城市
 * PUT /api/v1/admin/cities/:id
 * @param {number|string} id - 城市 ID
 * @param {Object} data - 要更新的字段
 */
export function updateCityApi(id, data) { return request.put(`/admin/cities/${id}`, data) }

/*
 * deleteCityApi — 删除城市
 * DELETE /api/v1/admin/cities/:id
 * @param {number|string} id - 城市 ID
 */
export function deleteCityApi(id) { return request.delete(`/admin/cities/${id}`) }
