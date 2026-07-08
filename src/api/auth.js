/*
 * 认证模块 — 登录、注册、用户信息、密码修改
 * 所有函数均使用 request 实例，自动携带令牌和统一错误处理
 */
import request from './request'

/*
 * loginApi — 用户登录
 * POST /api/v1/auth/login
 * @param {Object} data - { username, password }
 * @returns {Promise} - { access_token, refresh_token, role, user_id }
 */
export function loginApi(data) { return request.post('/auth/login', data) }

/*
 * shipperRegisterApi — 货主注册
 * POST /api/v1/shipper/register
 * @param {Object} data - 货主注册信息（公司名、法人代表等）
 */
export function shipperRegisterApi(data) { return request.post('/shipper/register', data) }

/*
 * shippingRegisterApi — 船公司注册
 * POST /api/v1/shipping/register
 * @param {Object} data - 船公司注册信息（公司名、联系人等）
 */
export function shippingRegisterApi(data) { return request.post('/shipping/register', data) }

/*
 * getCurrentUserApi — 获取当前登录用户信息
 * GET /api/v1/auth/me
 * 无需参数，令牌从请求拦截器自动注入
 */
export function getCurrentUserApi() { return request.get('/auth/me') }

/*
 * shipperChangePasswordApi — 货主修改密码
 * POST /api/v1/shipper/password/:id
 * @param {number|string} id - 货主用户 ID
 * @param {Object} data - { old_password, new_password }
 */
export function shipperChangePasswordApi(id, data) { return request.post(`/shipper/password/${id}`, data) }

/*
 * shippingChangePasswordApi — 船公司修改密码
 * POST /api/v1/shipping/password/:id
 * @param {number|string} id - 船公司用户 ID
 * @param {Object} data - { old_password, new_password }
 */
export function shippingChangePasswordApi(id, data) { return request.post(`/shipping/password/${id}`, data) }
