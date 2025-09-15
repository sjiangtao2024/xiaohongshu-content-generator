// ===================================================================================
// MODULE: UTILITY FUNCTIONS
// ===================================================================================

class Utils {
    // HTML转义函数
    static escapeHTML(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&quot;').replace(/'/g, '&#039;');
    }

    // 文本换行处理
    static wrapText(text, maxChars) {
        if (!text) return [''];
        const lines = [];
        let currentLine = '';
        for (let i = 0; i < text.length; i++) {
            currentLine += text[i];
            if (currentLine.length >= maxChars) {
                lines.push(currentLine);
                currentLine = '';
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines.length > 0 ? lines : [''];
    }

    // SVG转PNG
    static convertSvgToPng(svgString, bgUrl) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 1080;
            canvas.height = 1080;

            const bgImage = new Image();
            bgImage.src = bgUrl;

            bgImage.onload = () => {
                ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
                const svgImage = new Image();
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                svgImage.onload = () => {
                    ctx.drawImage(svgImage, 0, 0);
                    URL.revokeObjectURL(svgUrl);
                    resolve(canvas.toDataURL('image/png'));
                };
                svgImage.onerror = () => {
                    URL.revokeObjectURL(svgUrl);
                    reject(new Error('加载SVG图片用于转换失败。'));
                };
                svgImage.src = svgUrl;
            };
            bgImage.onerror = (err) => {
                reject(new Error('加载内嵌背景图失败！请检查Base64数据是否正确。'));
            };
        });
    }
}

// 导出工具类
window.Utils = Utils;