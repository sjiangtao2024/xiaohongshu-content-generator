// ===================================================================================
// MODULE: COMMENT PARSING FUNCTIONS
// ===================================================================================

class CommentParser {
    // 解析JSON格式的评论
    static parseJSONComments(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const comments = [];
            
            // 如果是数组格式，直接处理
            const items = Array.isArray(data) ? data : (data.comments || []);
            
            items.forEach(item => {
                // 主评论 - 只保留需要的字段
                const mainComment = {
                    username: item.author || '未知用户',
                    text: item.text || '',
                    likes: item.like_count || 0,
                    datetime: item.datetime || null,
                    replies: []
                };
                
                // 处理回复 - 只保留需要的字段
                if (item.replies && Array.isArray(item.replies)) {
                    item.replies.forEach(reply => {
                        // 过滤掉不需要的字段: id, parent, author_id, author_is_uploader, timestamp
                        mainComment.replies.push({
                            username: reply.author || '未知用户',
                            text: reply.text || '',
                            datetime: reply.datetime || null
                        });
                    });
                }
                
                comments.push(mainComment);
            });
            
            return comments;
        } catch (error) {
            throw new Error('JSON格式错误: ' + error.message);
        }
    }

    // 计算评论布局
    static calculateLayout(comment) {
        const layout = {};
        const textYOffset = 38.5;
        const lineHeight = 18;
        const cardGap = 5;
        const replyGap = 2;
        const mainMaxWidthChars = 60;
        const replyMaxWidthChars = 55;

        layout.mainTextLines = Utils.wrapText(comment.text, mainMaxWidthChars);
        const mainTextHeight = textYOffset + (layout.mainTextLines.length - 1) * lineHeight;
        layout.mainCardHeight = Math.max(45, mainTextHeight + 10);
        let totalHeight = layout.mainCardHeight;

        layout.repliesLayout = [];
        if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach(reply => {
                const replyLayout = {};
                replyLayout.textLines = Utils.wrapText(reply.text, replyMaxWidthChars);
                const replyTextHeight = (textYOffset - 10) + (replyLayout.textLines.length - 1) * lineHeight;
                replyLayout.cardHeight = Math.max(45, replyTextHeight + 10);
                totalHeight += replyLayout.cardHeight + replyGap;
                layout.repliesLayout.push(replyLayout);
            });
        }
        
        layout.totalHeight = totalHeight + cardGap;
        return { ...comment, layout };
    }

    // 将评论分块
    static chunkifyComments(commentsWithLayout) {
        const commentChunks = [];
        const maxImageHeight = 1060; 
        let currentChunk = [], currentHeight = 0;
        commentsWithLayout.forEach(comment => {
            const commentHeight = comment.layout.totalHeight;
            if (currentHeight + commentHeight > maxImageHeight && currentChunk.length > 0) {
                commentChunks.push(currentChunk);
                currentChunk = [];
                currentHeight = 0;
            }
            currentChunk.push(comment);
            currentHeight += commentHeight;
        });
        if (currentChunk.length > 0) commentChunks.push(currentChunk);
        return commentChunks;
    }
}

// 导出评论解析类
window.CommentParser = CommentParser;