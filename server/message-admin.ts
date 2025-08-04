import cloud from '@lafjs/cloud'
import { ObjectId } from 'mongodb'

const DB = cloud.database()
const MessageCollection = DB.collection('messages')

// 管理员密码
const ADMIN_PASSWORD = 'admin123'

/**
 * 留言管理接口
 * @param action 操作类型: list(列表), detail(详情), approve(审核), reject(拒绝), reply(回复), delete(删除)
 * @param password 管理员密码
 * @param page 页码
 * @param size 每页数量
 * @param status 状态过滤: 0(待审核), 1(已通过), 2(已拒绝)
 * @param id 留言ID
 * @param replyContent 回复内容
 * @returns 
 */
export async function main(ctx: FunctionContext) {
  // 设置 CORS headers
  ctx.response.setHeader('Access-Control-Allow-Origin', '*')
  ctx.response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  ctx.response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 处理 OPTIONS pre-flight 请求
  if (ctx.request.method === 'OPTIONS') {
    ctx.response.statusCode = 204
    return
  }

  const { action, password, page = 1, size = 10, status, id, replyContent } = ctx.body

  // 记录请求日志
  console.log('留言管理请求:', { action, password: '***', page, size, status, id })

  // 验证密码
  if (password !== ADMIN_PASSWORD) {
    return { ok: false, error: '管理员密码错误' }
  }

  // 根据不同操作类型处理
  switch (action) {
    case 'list':
      return await listMessages(page, size, status)
    case 'detail':
      return await getMessageDetail(id)
    case 'approve':
      return await approveMessage(id)
    case 'reject':
      return await rejectMessage(id)
    case 'reply':
      return await replyMessage(id, replyContent)
    case 'delete':
      return await deleteMessage(id)
    default:
      return { ok: false, error: '未知操作类型' }
  }
}

/**
 * 获取留言列表
 */
async function listMessages(page: number, size: number, status?: number) {
  try {
    const query: any = {}

    // 如果指定了状态，添加到查询条件
    if (status !== undefined) {
      query.status = status
    }

    // 计算总数
    const total = await MessageCollection.where(query).count()

    // 查询分页数据
    const list = await MessageCollection
      .where(query)
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * size)
      .limit(size)
      .get()

    return {
      ok: true,
      data: {
        list: list.data,
        pagination: {
          total: total.total,
          page,
          size,
          pages: Math.ceil(total.total / size)
        }
      }
    }
  } catch (error) {
    console.error('获取留言列表失败:', error)
    return { ok: false, error: '获取留言列表失败' }
  }
}

/**
 * 获取留言详情
 */
async function getMessageDetail(id: string) {
  if (!id) {
    return { ok: false, error: '留言ID不能为空' }
  }

  try {
    const message = await MessageCollection.doc(id).get()
    if (!message.data) {
      return { ok: false, error: '留言不存在' }
    }

    return {
      ok: true,
      data: message.data
    }
  } catch (error) {
    console.error('获取留言详情失败:', error)
    return { ok: false, error: '获取留言详情失败' }
  }
}

/**
 * 审核通过留言
 */
async function approveMessage(id: string) {
  if (!id) {
    return { ok: false, error: '留言ID不能为空' }
  }

  try {
    await MessageCollection.doc(id).update({
      status: 1,
      approvedAt: new Date()
    })

    return {
      ok: true,
      msg: '审核通过成功'
    }
  } catch (error) {
    console.error('审核留言失败:', error)
    return { ok: false, error: '审核留言失败' }
  }
}

/**
 * 拒绝留言
 */
async function rejectMessage(id: string) {
  if (!id) {
    return { ok: false, error: '留言ID不能为空' }
  }

  try {
    await MessageCollection.doc(id).update({
      status: 2,
      rejectedAt: new Date()
    })

    return {
      ok: true,
      msg: '拒绝留言成功'
    }
  } catch (error) {
    console.error('拒绝留言失败:', error)
    return { ok: false, error: '拒绝留言失败' }
  }
}

/**
 * 回复留言
 */
async function replyMessage(id: string, replyContent: string) {
  if (!id) {
    return { ok: false, error: '留言ID不能为空' }
  }

  if (!replyContent) {
    return { ok: false, error: '回复内容不能为空' }
  }

  try {
    await MessageCollection.doc(id).update({
      replyContent,
      replyTime: new Date(),
      // 回复的同时自动审核通过
      status: 1,
      approvedAt: new Date()
    })

    return {
      ok: true,
      msg: '回复留言成功'
    }
  } catch (error) {
    console.error('回复留言失败:', error)
    return { ok: false, error: '回复留言失败' }
  }
}

/**
 * 删除留言
 */
async function deleteMessage(id: string) {
  if (!id) {
    return { ok: false, error: '留言ID不能为空' }
  }

  try {
    await MessageCollection.doc(id).remove()

    return {
      ok: true,
      msg: '删除留言成功'
    }
  } catch (error) {
    console.error('删除留言失败:', error)
    return { ok: false, error: '删除留言失败' }
  }
} 