/*
 * 航次/靠泊模块 — 航次创建、靠泊时间更新、我的航次列表
 * 主要供船公司（shipping）角色使用
 */
import request from './request'

/*
 * createVoyageBerthingApi — 创建航次靠泊信息
 * POST /api/v1/voyages/berthing
 * @param {Object} data - { line_id, vessel_id, voyage_date, departure_time, arrival_time, ... }
 */
export function createVoyageBerthingApi(data) { return request.post('/voyages/berthing', data) }

/*
 * updateBerthingActualTimesApi — 更新靠泊实际时间
 * PUT /api/v1/berthings/:id/actual-times
 * @param {number|string} id - 靠泊记录 ID
 * @param {Object} data - { actual_departure_time, actual_arrival_time, ... }
 */
export function updateBerthingActualTimesApi(id, data) { return request.put(`/berthings/${id}/actual-times`, data) }

/*
 * getVoyageListApi — 获取我的航次列表
 * GET /api/v1/voyages/my
 * @param {Object} params - { page, page_size, status, ... }
 */
export function getVoyageListApi(params) { return request.get('/voyages/my', { params }) }
