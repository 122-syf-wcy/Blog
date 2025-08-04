import cloud from '@lafjs/cloud'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'

const DB = cloud.database()
// 创建上传记录集合
const UploadCollection = DB.collection('uploads')
// 管理员密码
const ADMIN_PASSWORD = 'admin123'
// 本地存储路径（如果云存储不可用）
const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'uploads')
// 基础URL，用于本地存储生成图片访问链接
const BASE_URL = 'https://rjjgamicpk.hzh.sealos.run'

// 内存存储，用于存储上传的图片数据（当云存储不可用时）
// 导出以便其他模块可以访问
export const memoryStorage = new Map();

/**
 * 文件上传接口
 * @param action 操作类型: upload(上传), list(列表), delete(删除)
 * @param password 管理员密码
 * @param file 文件的base64内容
 * @param filename 原始文件名
 * @param mime 文件mime类型
 * @param id 文件ID
 * @returns 上传结果或文件列表
 */
export async function main(ctx: any) {
  // 设置 CORS headers
  ctx.response.setHeader('Access-Control-Allow-Origin', '*')
  ctx.response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  ctx.response.setHeader('Access-control-allow-headers', 'Content-Type, Authorization')

  // 处理 OPTIONS pre-flight 请求
  if (ctx.request.method === 'OPTIONS') {
    ctx.response.statusCode = 204
    return
  }

  const { action, password, file, filename, mime, id } = ctx.body

  console.log('文件上传请求:', { action, password: password ? '***' : undefined, filename, mime, id })

  // 验证密码
  if (password !== ADMIN_PASSWORD) {
    return { ok: false, error: '管理员密码错误' }
  }

  switch (action) {
    case 'upload':
      return await uploadFile(file, filename, mime)
    case 'list':
      return await listFiles()
    case 'delete':
      return await deleteFile(id)
    default:
      return { ok: false, error: '未知操作类型' }
  }
}

/**
 * 上传文件
 */
async function uploadFile(file: string, filename: string, mime: string) {
  if (!file || !filename) {
    return { ok: false, error: '文件内容和文件名不能为空' }
  }

  try {
    // 获取文件扩展名
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
    // 检查是否为图片
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']

    if (!allowedTypes.includes(ext)) {
      return { ok: false, error: '只允许上传图片文件' }
    }

    // 解码Base64并去除前缀
    let base64Data = file
    if (file.includes('base64,')) {
      base64Data = file.split('base64,')[1]
    }

    // 生成唯一文件名
    const uniqueFilename = `${uuidv4()}.${ext}`
    const filePath = `images/${uniqueFilename}`
    let fileUrl: string | null = null

    // 尝试使用云存储上传文件
    try {
      if (typeof cloud.storage === 'function') {
        const storage = cloud.storage()
        const result = await storage.uploadFromDataURL(
          file,
          { filename: filePath }
        )
        fileUrl = result.url
        console.log('使用云存储上传成功')
      } else {
        throw new Error('云存储不可用')
      }
    } catch (cloudError) {
      console.error('云存储上传失败，尝试使用内存存储:', cloudError)

      // 降级使用内存存储
      try {
        // 直接存储base64数据到内存
        const key = `/uploads/${filePath}`
        memoryStorage.set(key, {
          data: base64Data,
          mime: mime || `image/${ext}`,
          created: new Date()
        })

        // 修复图片URL路径，直接使用图片数据的Data URL形式，避免API调用问题
        const sanitizedKey = key.replace(/^\//, ''); // 移除开头的斜杠，避免路径问题
        fileUrl = `data:${mime || `image/${ext}`};base64,${base64Data}`;
        console.log('使用内存存储上传成功，数据URL长度:', fileUrl.length)
      } catch (memoryError: any) {
        throw new Error(`内存存储也失败: ${memoryError.message}`)
      }
    }

    if (!fileUrl) {
      throw new Error('上传失败，未能获取文件URL')
    }

    // 保存上传记录到数据库
    const now = new Date()
    const fileRecord = {
      originalName: filename,
      filename: uniqueFilename,
      path: filePath,
      url: fileUrl,
      mime: mime || `image/${ext}`,
      size: Math.ceil(base64Data.length * 0.75), // 大致计算Base64解码后的大小
      uploadTime: now,
      lastAccessed: now,
      // 添加数据类型标记，方便后续管理
      isDataUrl: fileUrl.startsWith('data:'),
      storageType: 'memory'
    }

    const addResult = await UploadCollection.add(fileRecord)
    console.log('文件记录已添加到数据库:', addResult)

    return {
      ok: true,
      msg: '上传成功',
      data: {
        url: fileUrl,
        filename: uniqueFilename,
        path: filePath
      }
    }
  } catch (error: any) {
    console.error('上传文件失败:', error)
    return { ok: false, error: `上传文件失败: ${error.message}` }
  }
}

/**
 * 获取上传的文件列表
 */
async function listFiles() {
  try {
    const files = await UploadCollection
      .orderBy('uploadTime', 'desc')
      .limit(100)
      .get()

    // 确保返回一个一致的数据格式
    return {
      ok: true,
      data: files.data || [] // 确保返回一个数组
    }
  } catch (error: any) {
    console.error('获取文件列表失败:', error)
    return { ok: false, error: '获取文件列表失败' }
  }
}

/**
 * 删除文件
 */
async function deleteFile(id: string) {
  if (!id) {
    return { ok: false, error: '文件ID不能为空' }
  }

  try {
    // 查询文件记录
    const fileRecord = await UploadCollection.doc(id).get()

    if (!fileRecord.data) {
      return { ok: false, error: '文件不存在' }
    }

    const filePath = fileRecord.data.path

    // 尝试从云存储删除文件
    try {
      if (typeof cloud.storage === 'function') {
        const storage = cloud.storage()
        await storage.deleteFile(filePath)
        console.log('从云存储删除文件成功')
      } else {
        throw new Error('云存储不可用')
      }
    } catch (cloudError) {
      console.error('从云存储删除文件失败:', cloudError)

      // 尝试从内存存储删除
      try {
        const key = `/uploads/${filePath}`
        if (memoryStorage.has(key)) {
          memoryStorage.delete(key)
          console.log('从内存存储删除文件成功')
        }
      } catch (memoryError) {
        console.error('从内存存储删除文件失败:', memoryError)
      }
    }

    // 从数据库中删除记录
    await UploadCollection.doc(id).remove()

    return {
      ok: true,
      msg: '文件删除成功'
    }
  } catch (error: any) {
    console.error('删除文件失败:', error)
    return { ok: false, error: `删除文件失败: ${error.message}` }
  }
}

/**
 * 获取内存中存储的图片
 * 需要创建一个新的API端点来提供这个功能
 */
export async function getImage(ctx: any) {
  const { key } = ctx.query || {}

  if (!key) {
    return { ok: false, error: '缺少图片标识符' }
  }

  const imageData = memoryStorage.get(key)
  if (!imageData) {
    return { ok: false, error: '图片不存在或已过期' }
  }

  // 更新最后访问时间
  imageData.lastAccessed = new Date()

  // 返回图片数据
  return {
    ok: true,
    data: {
      content: imageData.data,
      mime: imageData.mime
    }
  }
}

