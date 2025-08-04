import cloud from '@lafjs/cloud'

const DB = cloud.database()
const ArticleCollection = DB.collection('articles')

// 管理员密码
const ADMIN_PASSWORD = 'admin123'

/**
 * 博客文章接口
 * @param action 操作类型: add(新增), list(列表), get(获取单篇), update(更新), delete(删除)
 * @param password 管理员密码 (仅管理操作需要)
 * @param article 文章内容
 * @param id 文章ID
 * @param page 页码
 * @param size 每页数量
 * @param category 分类
 * @param tag 标签
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

    const { action, password, article, id, page = 1, size = 10, category, tag } = ctx.body

    // 记录请求日志
    console.log('博客文章请求:', { action, password: password ? '***' : undefined, id, page, size, category, tag })

    // 处理不同操作
    switch (action) {
        // 公开接口 - 不需要密码
        case 'list':
            return await listArticles(page, size, category, tag)
        case 'get':
            return await getArticle(id)

        // 管理接口 - 需要密码
        case 'add':
        case 'update':
        case 'delete':
            // 验证密码
            if (password !== ADMIN_PASSWORD) {
                return { ok: false, error: '管理员密码错误' }
            }

            if (action === 'add') {
                return await addArticle(article)
            } else if (action === 'update') {
                return await updateArticle(id, article)
            } else if (action === 'delete') {
                return await deleteArticle(id)
            }
            break

        default:
            return { ok: false, error: '未知操作类型' }
    }
}

/**
 * 新增文章
 */
async function addArticle(article: any) {
    // 验证必填字段
    if (!article || !article.title || !article.content) {
        return { ok: false, error: '标题和内容不能为空' }
    }

    try {
        // 添加创建时间和更新时间
        const now = new Date()
        const articleData = {
            ...article,
            createdAt: now,
            updatedAt: now,
            views: 0 // 初始化阅读量
        }

        // 保存到数据库
        const result = await ArticleCollection.add(articleData)

        return {
            ok: true,
            msg: '文章发布成功',
            data: {
                id: result._id
            }
        }
    } catch (error) {
        console.error('发布文章失败:', error)
        return { ok: false, error: '发布文章失败' }
    }
}

/**
 * 获取文章列表
 */
async function listArticles(page: number, size: number, category?: string, tag?: string) {
    try {
        // 构建查询条件
        let query: any = {}

        // 如果指定了分类
        if (category) {
            query.category = category
        }

        // 如果指定了标签
        if (tag) {
            query.tags = tag // 假设tags是数组，包含该tag即可
        }

        // 计算总数
        const total = await ArticleCollection.where(query).count()

        // 查询分页数据
        const list = await ArticleCollection
            .where(query)
            .orderBy('createdAt', 'desc') // 按创建时间降序
            .skip((page - 1) * size)
            .limit(size)
            .get()

        return {
            ok: true,
            data: {
                list: list.data.map(article => ({
                    ...article,
                    // 列表中不返回完整内容，只返回摘要
                    content: article.content.length > 200 ? article.content.substring(0, 200) + '...' : article.content
                })),
                pagination: {
                    total: total.total,
                    page,
                    size,
                    pages: Math.ceil(total.total / size)
                }
            }
        }
    } catch (error) {
        console.error('获取文章列表失败:', error)
        return { ok: false, error: '获取文章列表失败' }
    }
}

/**
 * 获取单篇文章
 */
async function getArticle(id: string) {
    if (!id) {
        return { ok: false, error: '文章ID不能为空' }
    }

    try {
        // 获取文章
        const article = await ArticleCollection.doc(id).get()

        if (!article.data) {
            return { ok: false, error: '文章不存在' }
        }

        // 更新阅读量
        await ArticleCollection.doc(id).update({
            views: (article.data.views || 0) + 1
        })

        return {
            ok: true,
            data: {
                ...article.data,
                views: (article.data.views || 0) + 1 // 返回更新后的阅读量
            }
        }
    } catch (error) {
        console.error('获取文章失败:', error)
        return { ok: false, error: '获取文章失败' }
    }
}

/**
 * 更新文章
 */
async function updateArticle(id: string, article: any) {
    if (!id) {
        return { ok: false, error: '文章ID不能为空' }
    }

    if (!article || (!article.title && !article.content)) {
        return { ok: false, error: '更新内容不能为空' }
    }

    try {
        // 更新时间
        article.updatedAt = new Date()

        await ArticleCollection.doc(id).update(article)

        return {
            ok: true,
            msg: '文章更新成功'
        }
    } catch (error) {
        console.error('更新文章失败:', error)
        return { ok: false, error: '更新文章失败' }
    }
}

/**
 * 删除文章
 */
async function deleteArticle(id: string) {
    if (!id) {
        return { ok: false, error: '文章ID不能为空' }
    }

    try {
        await ArticleCollection.doc(id).remove()

        return {
            ok: true,
            msg: '文章删除成功'
        }
    } catch (error) {
        console.error('删除文章失败:', error)
        return { ok: false, error: '删除文章失败' }
    }
} 