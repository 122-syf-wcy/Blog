import cloud from '@lafjs/cloud'

// 从upload.ts导入内存存储
// 注意：这里假设memoryStorage是从upload.ts导出的，如果不是，需要修改导入方式
import { memoryStorage } from './upload'

/**
 * 获取图片API
 * 用于获取内存中存储的图片数据
 * @param key 图片的唯一标识符
 * @returns 图片数据或错误信息
 */
export async function main(ctx: any) {
  // 设置 CORS headers
  ctx.response.setHeader('Access-Control-Allow-Origin', '*')
  ctx.response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  ctx.response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 处理 OPTIONS pre-flight 请求
  if (ctx.request.method === 'OPTIONS') {
    ctx.response.statusCode = 204
    return
  }

  console.log('获取图片请求:', ctx.query);
  console.log('当前内存存储大小:', memoryStorage ? memoryStorage.size : 'memoryStorage未初始化');

  // 获取请求参数
  const { key } = ctx.query || {}

  if (!key) {
    console.error('请求缺少key参数');
    return { ok: false, error: '缺少图片标识符' }
  }

  // 检查内存存储是否初始化
  if (!memoryStorage) {
    console.error('内存存储未初始化');
    return { ok: false, error: '内存存储未初始化' }
  }

  // 输出所有可用的key，方便调试
  console.log('可用的图片key:', Array.from(memoryStorage.keys()));

  // 从内存存储中获取图片数据
  const imageData = memoryStorage.get(key)
  if (!imageData) {
    console.error('图片不存在或已过期, key:', key);
    console.log('当前内存存储包含keys:', Array.from(memoryStorage.keys()));
    return { ok: false, error: '图片不存在或已过期' }
  }

  console.log('找到图片数据:', { mime: imageData.mime, dataLength: imageData.data?.length });

  // 更新最后访问时间
  imageData.lastAccessed = new Date()

  // 返回图片数据格式由服务器配置决定
  try {
    // 尝试直接返回原始二进制数据和MIME类型
    if (ctx.response && ctx.response.set) {
      ctx.response.set('Content-Type', imageData.mime || 'image/jpeg');
      ctx.response.set('Cache-Control', 'public, max-age=31536000'); // 缓存一年
    }

    // 注意：返回的格式可能需要根据具体平台调整
    // 有些平台支持直接返回 Buffer，有些则需要 base64 字符串
    // 这里尝试两种方式
    try {
      // 方法1: 返回Buffer (如果平台支持)
      return Buffer.from(imageData.data, 'base64');
    } catch (bufferError) {
      console.log('Buffer返回失败，尝试返回base64:', bufferError);

      // 方法2: 返回包含base64的对象
      return {
        ok: true,
        mime: imageData.mime,
        data: imageData.data,
        // 同时提供编码好的HTML img标签，方便直接嵌入
        html: `<img src="data:${imageData.mime};base64,${imageData.data}" />`
      };
    }
  } catch (error) {
    console.error('返回图片数据时出错:', error);
    return {
      ok: false,
      error: '处理图片数据时出错',
      details: error.message
    }
  }
} 