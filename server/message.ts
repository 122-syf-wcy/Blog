import cloud from "@lafjs/cloud";
import { createHash } from "crypto";

const db = cloud.database();
const _ = db.command;

// 添加留言
export async function addMessage(ctx: FunctionContext) {
  const { content, nickname, email, website, articleId } = ctx.body;

  // 校验留言内容是否为空
  if (!content) {
    return { error: "留言内容不能为空" };
  }

  // 校验昵称是否为空
  if (!nickname) {
    return { error: "昵称不能为空" };
  }

  const clientIp = ctx.headers['x-real-ip'] || '未知IP';

  try {
    // 将留言信息存入数据库
    const { id } = await db.collection("messages").add({
      content,
      nickname,
      email: email || '',
      website: website || '',
      articleId: articleId || null,  // 如果有关联文章则存储文章ID，否则为null
      ip: clientIp,
      createdAt: new Date(),
      status: 0,  // 0: 待审核, 1: 已通过, 2: 已拒绝
      replyContent: null,  // 管理员回复内容
      replyTime: null      // 回复时间
    });

    return {
      ok: true,
      msg: '留言提交成功，等待审核！',
      data: { id }
    };
  } catch (error) {
    return {
      error: "留言提交失败，请稍后重试",
      detail: error.message
    };
  }
}

// 获取留言列表
export async function getMessages(ctx: FunctionContext) {
  const { articleId, status, page = 1, size = 10 } = ctx.body;

  try {
    let query = {};
    if (articleId) {
      query = { ...query, articleId };
    }
    if (status !== undefined) {
      query = { ...query, status };
    }

    // 查询总数
    const { total } = await db.collection("messages")
      .where(query)
      .count();

    // 分页查询留言列表，按创建时间降序排列
    const { data } = await db.collection("messages")
      .where(query)
      .orderBy("createdAt", "desc")
      .skip((page - 1) * size)
      .limit(size)
      .get();

    return {
      ok: true,
      data: {
        list: data,
        pagination: {
          page,
          size,
          total,
          pages: Math.ceil(total / size)
        }
      }
    };
  } catch (error) {
    console.error('获取留言列表失败:', error);
    return {
      error: "获取留言列表失败",
      detail: error.message
    };
  }
}


// 审核留言
export async function reviewMessage(ctx: FunctionContext) {
  const { id, status, replyContent } = ctx.body;

  // 检查用户权限（管理员权限检查）
  const user = ctx.user;
  if (!user || user.role !== 'admin') {
    return { error: "无权限执行此操作" };
  }

  if (!id) {
    return { error: "留言ID不能为空" };
  }

  if (![1, 2].includes(status)) {
    return { error: "状态参数错误" };
  }

  try {
    const updateData: any = { status };

    // 如果有回复内容，添加回复内容和回复时间
    if (replyContent) {
      updateData.replyContent = replyContent;
      updateData.replyTime = new Date();
    }

    const { updated } = await db.collection("messages")
      .where({ _id: id })
      .update(updateData);

    if (updated === 1) {
      return {
        ok: true,
        msg: status === 1 ? '留言审核通过' : '留言已拒绝'
      };
    } else {
      return { error: "留言不存在或已被处理" };
    }
  } catch (error) {
    return {
      error: "处理留言失败",
      detail: error.message
    };
  }
}

// 删除留言
export async function deleteMessage(ctx: FunctionContext) {
  const { id } = ctx.body;

  // 检查用户权限（管理员权限检查）
  const user = ctx.user;
  if (!user || user.role !== 'admin') {
    return { error: "无权限执行此操作" };
  }

  if (!id) {
    return { error: "留言ID不能为空" };
  }

  try {
    const { deleted } = await db.collection("messages")
      .where({ _id: id })
      .remove();

    if (deleted === 1) {
      return {
        ok: true,
        msg: '留言已删除'
      };
    } else {
      return { error: "留言不存在或已被删除" };
    }
  } catch (error) {
    return {
      error: "删除留言失败",
      detail: error.message
    };
  }
}

// 回复留言
export async function replyMessage(ctx: FunctionContext) {
  const { id, replyContent } = ctx.body;

  // 检查用户权限（管理员权限检查）
  const user = ctx.user;
  if (!user || user.role !== 'admin') {
    return { error: "无权限执行此操作" };
  }

  if (!id) {
    return { error: "留言ID不能为空" };
  }

  if (!replyContent) {
    return { error: "回复内容不能为空" };
  }

  try {
    const { updated } = await db.collection("messages")
      .where({ _id: id })
      .update({
        replyContent,
        replyTime: new Date(),
        status: 1  // 回复的同时将留言设为已通过
      });

    if (updated === 1) {
      return {
        ok: true,
        msg: '回复成功'
      };
    } else {
      return { error: "留言不存在或已被删除" };
    }
  } catch (error) {
    return {
      error: "回复留言失败",
      detail: error.message
    };
  }
}

// 主函数，路由分发
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

  console.log('收到请求参数:', ctx.body);

  try {
    const { action } = ctx.body || {};

    // 测试API连接请求
    if (action === 'test') {
      console.log('收到测试请求');
      return {
        ok: true,
        msg: 'API连接成功',
        time: new Date().toISOString()
      };
    }

    // 确保action不为空
    if (!action) {
      console.error('请求中缺少action参数');
      return { error: "缺少action参数" };
    }

    // 路由分发
    switch (action) {
      case 'add':
        console.log('处理添加留言请求');
        return await addMessage(ctx);
      case 'list':
        console.log('处理获取留言列表请求');
        return await getMessages(ctx);
      case 'review':
        return await reviewMessage(ctx);
      case 'delete':
        return await deleteMessage(ctx);
      case 'reply':
        return await replyMessage(ctx);
      default:
        console.error('未知操作类型:', action);
        return { error: `未知的操作类型: ${action}` };
    }
  } catch (error) {
    console.error('处理请求时发生错误:', error);
    return { error: "服务端错误", detail: error.message };
  }
}

// 确保集合存在
async function ensureCollectionExists(collectionName: string) {
  try {
    // 尝试检查集合是否存在
    const collections = await cloud.mongo.db.listCollections({ name: collectionName }).toArray();

    // 如果集合不存在，则创建它
    if (collections.length === 0) {
      console.log(`创建集合: ${collectionName}`);
      await cloud.mongo.db.createCollection(collectionName);

      // 如果是messages集合，添加索引
      if (collectionName === 'messages') {
        await cloud.mongo.db.collection(collectionName).createIndex({ createdAt: -1 });
        await cloud.mongo.db.collection(collectionName).createIndex({ status: 1 });
      }
    }
  } catch (error) {
    console.error(`确保集合存在时出错 ${collectionName}:`, error);
    // 我们不抛出错误，只记录它，因为即使索引创建失败，集合仍然可以使用
  }
}
