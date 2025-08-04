// 等待页面加载完成
document.addEventListener('DOMContentLoaded', function () {
    // 获取当前页面URL
    const currentPage = window.location.pathname.split('/').pop();

    // 添加留言板和评论功能
    setupFormSubmission();

    // 设置背景视频
    setupBackgroundVideo();

    // 博客页面特定功能
    if (currentPage === 'blog.html') {
        setupBlogFilters();
    }

    // 博客文章页面特定功能
    if (currentPage === 'blog-post.html') {
        setupCommentActions();
        loadBlogPost();
    }
});

// 设置背景视频
function setupBackgroundVideo() {
    const video = document.getElementById('bg-video');
    if (video) {
        // 懒加载视频
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const source = video.querySelector('source');
                    const originalSrc = source.getAttribute('src');
                    source.setAttribute('src', originalSrc);
                    video.load();
                    video.play().catch(err => {
                        console.warn('自动播放视频失败:', err);
                    });
                    observer.unobserve(video);
                }
            });
        }, { threshold: 0.1 });

        observer.observe(video);

        // 视频加载失败时处理
        video.addEventListener('error', function () {
            console.error('视频加载失败');
            const videoContainer = document.querySelector('.video-container');
            if (videoContainer) {
                videoContainer.style.backgroundImage = "url('images/fallback-bg.jpg')";
                videoContainer.style.backgroundSize = "cover";
                videoContainer.style.backgroundPosition = "center";
            }
        });
    }
}

// 设置表单提交
function setupFormSubmission() {
    // 评论表单
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('comment-name').value;
            const email = document.getElementById('comment-email').value;
            const comment = document.getElementById('comment-text').value;

            if (name && email && comment) {
                // 这里应该是AJAX请求发送到服务器
                // 但由于没有后端，我们模拟一个成功提交
                alert('评论提交成功！在实际应用中，这会发送到服务器进行处理。');
                commentForm.reset();
            }
        });
    }

    // 联系表单
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            alert('消息发送成功！在实际应用中，这会发送到服务器进行处理。');
            contactForm.reset();
        });
    }
}

// 设置博客过滤功能
function setupBlogFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const blogList = document.getElementById('blog-list');
    const blogItems = blogList.querySelectorAll('.blog-item');

    if (searchInput) {
        searchInput.addEventListener('input', filterBlogs);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterBlogs);
    }

    function filterBlogs() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        blogItems.forEach(item => {
            const title = item.querySelector('h2').textContent.toLowerCase();
            const excerpt = item.querySelector('.blog-excerpt').textContent.toLowerCase();
            const itemCategory = item.querySelector('.category').textContent.toLowerCase();

            const matchesSearch = title.includes(searchTerm) || excerpt.includes(searchTerm);
            const matchesCategory = category === 'all' || itemCategory.includes(category);

            if (matchesSearch && matchesCategory) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

// 设置评论区的操作
function setupCommentActions() {
    const replyButtons = document.querySelectorAll('.reply-btn');
    const likeButtons = document.querySelectorAll('.like-btn');

    replyButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const commentForm = document.getElementById('comment-form');
            const commentText = document.getElementById('comment-text');

            if (commentForm && commentText) {
                commentForm.scrollIntoView({ behavior: 'smooth' });
                commentText.focus();
            }
        });
    });

    likeButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const likeCount = button.querySelector('span');
            if (likeCount) {
                let count = parseInt(likeCount.textContent);
                likeCount.textContent = count + 1;

                // 添加一个已点赞的效果
                button.classList.add('liked');
                button.querySelector('i').classList.remove('far');
                button.querySelector('i').classList.add('fas');

                // 实际应用中这里应该发送AJAX请求到服务器
            }
        });
    });
}

// 加载博客文章内容（从URL参数获取文章ID）
function loadBlogPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        // 实际应用中，这里应该发送AJAX请求获取文章内容
        // 由于没有后端，我们这里只是示例，不做实际加载
        console.log('加载文章ID:', postId);

        // 更新文章导航链接
        updatePostNavigation(postId);
    }
}

// 更新文章导航（上一篇/下一篇）
function updatePostNavigation(currentId) {
    const prevPost = document.querySelector('.prev-post');
    const nextPost = document.querySelector('.next-post');

    // 将ID转换为数字
    const id = parseInt(currentId);

    if (prevPost && id > 1) {
        prevPost.href = `blog-post.html?id=${id - 1}`;
    } else if (prevPost) {
        prevPost.style.visibility = 'hidden';
    }

    if (nextPost) {
        // 假设我们有4篇文章
        if (id < 4) {
            nextPost.href = `blog-post.html?id=${id + 1}`;
        } else {
            nextPost.style.visibility = 'hidden';
        }
    }
}

// 设置留言板页面的回复按钮
function setupReplyButtons() {
    const messagesContainer = document.getElementById('messages-list');

    // 使用事件委托来处理动态加载的回复按钮
    messagesContainer.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('reply-btn')) {
            e.preventDefault();

            const replyTo = e.target.getAttribute('data-reply-to');
            const messageForm = document.getElementById('message-form');
            const contentTextarea = document.getElementById('message-content');

            if (messageForm && contentTextarea && replyTo) {
                contentTextarea.value = `@${replyTo} `;
                contentTextarea.focus();
                messageForm.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
}

// 显示通知
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = 'notification';
        notification.classList.add(type); // type 可以是 success, error, info 等
        notification.style.display = 'block';

        // 3秒后自动隐藏
        setTimeout(function () {
            notification.style.display = 'none';
        }, 3000);
    }
}

// 加载留言列表
function loadMessages(page = 1) {
    const messagesContainer = document.getElementById('messages-list');
    const paginationContainer = document.getElementById('pagination');

    if (!messagesContainer) return;

    // 显示加载状态
    messagesContainer.innerHTML = '<div class="loading">加载中...</div>';

    // 使用axios从后端获取留言列表
    axios.post('https://c2cbyl4kzd.hzh.sealos.run/message', {
        action: 'list',
        status: 1, // 只显示已审核通过的留言
        page: page,
        size: 10
    })
        .then(function (response) {
            if (response.data.ok && response.data.data) {
                const { list, pagination } = response.data.data;

                if (list.length === 0) {
                    messagesContainer.innerHTML = '<div class="no-messages">暂无留言</div>';
                    paginationContainer.innerHTML = '';
                    return;
                }

                // 渲染留言列表
                messagesContainer.innerHTML = '';
                list.forEach(message => {
                    const messageDate = new Date(message.createdAt);
                    const formattedDate = formatDate(messageDate);

                    const messageElement = document.createElement('div');
                    messageElement.className = 'message-item';
                    messageElement.innerHTML = `
                    <div class="message-avatar">
                        <img src="https://www.gravatar.com/avatar/${md5(message.email)}?d=mp" alt="${message.nickname}的头像">
                    </div>
                    <div class="message-content">
                        <div class="message-meta">
                            <span class="message-author">${message.nickname}</span>
                            ${message.website ? `<a href="${message.website}" target="_blank" class="website-link"><i class="fas fa-link"></i></a>` : ''}
                            <span class="message-date">${formattedDate}</span>
                        </div>
                        <p class="message-text">${message.content}</p>
                        <div class="message-actions">
                            <a href="#message-form" class="reply-btn" data-reply-to="${message.nickname}">回复</a>
                        </div>
                        
                        ${message.replyContent ? `
                        <div class="message-reply">
                            <div class="message-avatar">
                                <img src="images/avatar.jpg" alt="Aurora头像">
                            </div>
                            <div class="message-content">
                                <div class="message-meta">
                                    <span class="message-author">Aurora</span>
                                    <span class="message-date">${formatDate(new Date(message.replyTime))}</span>
                                </div>
                                <p class="message-text">${message.replyContent}</p>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;

                    messagesContainer.appendChild(messageElement);
                });

                // 渲染分页
                if (pagination && pagination.pages > 1) {
                    renderPagination(pagination, paginationContainer);
                } else {
                    paginationContainer.innerHTML = '';
                }
            } else {
                messagesContainer.innerHTML = '<div class="error">加载留言失败</div>';
            }
        })
        .catch(function (error) {
            console.error('获取留言列表错误:', error);
            messagesContainer.innerHTML = '<div class="error">加载留言失败，请稍后重试</div>';
        });
}

// 渲染分页
function renderPagination(pagination, container) {
    if (!container) return;

    const { page, pages } = pagination;
    container.innerHTML = '';

    // 前一页按钮
    if (page > 1) {
        const prevLink = document.createElement('a');
        prevLink.href = 'javascript:void(0)';
        prevLink.innerHTML = '&laquo; 上一页';
        prevLink.addEventListener('click', function () {
            loadMessages(page - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        container.appendChild(prevLink);
    }

    // 页码按钮
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(pages, page + 2);

    // 确保显示至少5个页码（如果有）
    if (endPage - startPage < 4) {
        if (startPage === 1) {
            endPage = Math.min(pages, startPage + 4);
        } else if (endPage === pages) {
            startPage = Math.max(1, endPage - 4);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLink = document.createElement('a');
        pageLink.href = 'javascript:void(0)';
        pageLink.textContent = i;
        if (i === page) {
            pageLink.className = 'active';
        }
        pageLink.addEventListener('click', function () {
            loadMessages(i);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        container.appendChild(pageLink);
    }

    // 下一页按钮
    if (page < pages) {
        const nextLink = document.createElement('a');
        nextLink.href = 'javascript:void(0)';
        nextLink.innerHTML = '下一页 &raquo;';
        nextLink.className = 'next';
        nextLink.addEventListener('click', function () {
            loadMessages(page + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        container.appendChild(nextLink);
    }
}

// 格式化日期
function formatDate(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 简单的MD5实现（用于Gravatar头像）
function md5(string) {
    // 这里使用一个简化版本，实际应用中应使用完整的MD5库
    return Array.from(string).reduce(
        (hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0
    ).toString(16).replace(/^-/, '');
}

// 添加一个滚动到顶部的按钮（在较长的页面上）
window.addEventListener('scroll', function () {
    const scrollToTopBtn = document.getElementById('scroll-to-top');

    if (!scrollToTopBtn && window.pageYOffset > 300) {
        // 如果按钮不存在且滚动超过300px，创建按钮
        const btn = document.createElement('button');
        btn.id = 'scroll-to-top';
        btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        btn.style.position = 'fixed';
        btn.style.bottom = '20px';
        btn.style.right = '20px';
        btn.style.zIndex = '99';
        btn.style.borderRadius = '50%';
        btn.style.width = '50px';
        btn.style.height = '50px';
        btn.style.fontSize = '20px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';

        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.body.appendChild(btn);
    } else if (scrollToTopBtn && window.pageYOffset <= 300) {
        // 如果按钮存在且滚动未超过300px，移除按钮
        scrollToTopBtn.remove();
    }
}); 