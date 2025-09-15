// ===================================================================================
// MODULE: IMAGE GENERATION FUNCTIONS
// ===================================================================================

class ImageGenerator {
    // 生成SVG
    static generateSVG(commentsWithLayout) {
        let currentY = 20;
        let svgContent = '';

        commentsWithLayout.forEach(comment => {
            const { layout, username, replies, likes, datetime } = comment;
            const { mainCardHeight, mainTextLines, repliesLayout } = layout;
            
            const escapedUsername = Utils.escapeHTML(username);
            let mainTspans = mainTextLines.map((line, index) => 
                `<tspan x="65" dy="${index === 0 ? 0 : 18}">${Utils.escapeHTML(line)}</tspan>`
            ).join('');
            
            // 构建时间显示内容
            let datetimeContent = '';
            if (datetime) {
                // 将datetime放在靠近点赞图标的位置，但确保不会重叠
                const datetimeX = 800; // 固定位置，靠近点赞图标但不会重叠
                datetimeContent = `<text x="${datetimeX}" y="19.5" class="datetime-text">${Utils.escapeHTML(datetime)}</text>`;
            }
            
            let likeContent = '';
            if (likes !== null) {
                // 将点赞图标放在评论框右上角内部，确保不会超出边界
                likeContent = `
                    <g transform="translate(930, 15)">
                        <use href="#like-icon" />
                        <text x="25" y="10" class="like-count" text-anchor="start">${likes}</text>
                    </g>
                `;
            }

            svgContent += `
                <g transform="translate(0, ${currentY})">
                    <rect width="1000" height="${mainCardHeight}" class="card-dense" filter="url(#shadow)"/>
                    <circle cx="35" cy="22.5" r="15" class="avatar-bg"/>
                    <text x="65" y="19.5" class="nickname-dense">@${escapedUsername}</text>
                    ${datetimeContent}
                    <text x="65" y="38.5" class="comment-dense">${mainTspans}</text>
                    ${likeContent}
                </g>
            `;
            currentY += mainCardHeight;

            if (replies && replies.length > 0) {
                 replies.forEach((reply, index) => {
                    const replyLayout = repliesLayout[index];
                    const escapedReplyUsername = Utils.escapeHTML(reply.username);
                    let replyTspans = replyLayout.textLines.map((line, lineIndex) => 
                        `<tspan x="55" dy="${lineIndex === 0 ? 0 : 18}">${Utils.escapeHTML(line)}</tspan>`
                    ).join('');
                    
                    currentY += 2;

                    // 回复也支持时间显示
                    let replyDatetimeContent = '';
                    if (reply.datetime) {
                        // 将回复的datetime放在靠近点赞图标的位置，但确保不会重叠
                        const replyDatetimeX = 780; // 回复区域的固定位置
                        replyDatetimeContent = `<text x="${replyDatetimeX}" y="19.5" class="datetime-text">${Utils.escapeHTML(reply.datetime)}</text>`;
                    }

                    svgContent += `
                        <g transform="translate(50, ${currentY})">
                             <rect width="950" height="${replyLayout.cardHeight}" class="reply-card"/>
                             <circle cx="32" cy="22.5" r="12" class="avatar-bg"/>
                             <text x="55" y="19.5" class="nickname-dense">@${escapedReplyUsername}</text>
                             ${replyDatetimeContent}
                             <text x="55" y="37.5" class="comment-dense" font-size="13">${replyTspans}</text>
                        </g>
                    `;
                    currentY += replyLayout.cardHeight;
                 });
            }
            currentY += 5;
        });

        return `
            <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.15"/>
                    </filter>
                    <g id="like-icon" transform="scale(0.9)">
                        <path fill="#FF6B6B" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                    </g>
                    <style>
                        .bg { fill: transparent; }
                        .card-dense { fill: rgba(255, 255, 255, 0.96); rx: 8; ry: 8; stroke: rgba(0, 0, 0, 0.05); stroke-width: 1; }
                        .avatar-bg { fill: #FFE0B2; }
                        .nickname-dense { font-family: 'sans-serif'; font-size: 15px; font-weight: 700; fill: #BF360C; }
                        .comment-dense { font-family: 'sans-serif'; font-size: 14px; fill: #37474F; }
                        .like-count { font-family: 'sans-serif'; font-size: 12px; fill: #FF6B6B; font-weight: 600; alignment-baseline: middle;}
                        .reply-card { fill: rgba(247, 247, 247, 0.98); rx: 6; ry: 6; }
                        .datetime-text { font-family: 'sans-serif'; font-size: 12px; fill: #999999; }
                    </style>
                </defs>
                <rect width="1080" height="1080" class="bg"/>
                <g transform="translate(40, 0)">
                    ${svgContent}
                </g>
            </svg>
        `;
    }
}

// 导出图片生成器类
window.ImageGenerator = ImageGenerator;