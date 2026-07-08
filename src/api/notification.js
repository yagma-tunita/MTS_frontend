/*
 * 通知模块 — 通知列表、标记已读、发送通知（管理员）
 * 通知为内存存储（go-cache），重启后丢失
 */
import request from './request'

/*
 * getNotificationListApi — 获取当前用户的通知列表
 * GET /api/v1/notifications
 * @param {Object} params - { page, page_size, is_read, ... }
 */
export function getNotificationListApi(params) { return request.get('/notifications', { params }) }

/*
 * markNotificationReadApi — 标记单条通知为已读
 * PUT /api/v1/notifications/:id/read
 * @param {number|string} id - 通知 ID
 */
export function markNotificationReadApi(id) { return request.put(`/notifications/${id}/read`) }

/*
 * sendNotificationApi — 管理员发送通知（广播或指定用户）
 * POST /api/v1/admin/notifications
 * 需要 admin 角色权限
 * @param {Object} data - { title, content, target_role, target_user_id, ... }
 */
export function sendNotificationApi(data) { return request.post('/admin/notifications', data) }
