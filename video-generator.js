/**
 * @file 视频生成模块
 * @description 负责调用FFmpeg，根据图片和配置生成视频文件。
 */

const VideoGenerator = (() => {
    // 从全局FFmpeg对象中获取fetchFile工具，用于处理data URL
    const { fetchFile } = FFmpeg;

    /**
     * 生成视频的核心函数
     * @param {Array} images - 包含 { dataUrl, caption } 的图片对象数组
     * @param {Object} config - 视频配置，如 { screenshotDuration, commentDuration, transition, ... }
     * @param {Function} progressCallback - 用于报告进度的回调函数
     * @returns {Blob} - 生成的视频文件Blob
     */
    async function generate(images, config, progressCallback) {
        // 1. 加载FFmpeg实例
        progressCallback({ status: 'loading_ffmpeg', text: '正在加载FFmpeg核心...' });
        const ffmpeg = await FFmpegLoader.load(({ ratio }) => {
            const percentage = Math.round(ratio * 100);
            progressCallback({ status: 'loading_ffmpeg', text: `加载中... ${percentage}%`, percentage });
        });

        // 2. 将图片写入FFmpeg的虚拟文件系统
        progressCallback({ status: 'writing_files', text: '正在写入图片素材...', percentage: 0 });
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            // FFmpeg的fetchFile可以方便地处理data URL
            ffmpeg.FS('writeFile', `img${String(i).padStart(3, '0')}.png`, await fetchFile(img.dataUrl));
            const percentage = Math.round(((i + 1) / images.length) * 100);
            progressCallback({ status: 'writing_files', text: `写入中... (${i + 1}/${images.length})`, percentage });
        }

        // 3. 构建FFmpeg命令 (暂时为占位符)
        progressCallback({ status: 'generating_command', text: '正在生成处理指令...' });
        const command = buildCommand(images, config);
        console.log('执行FFmpeg指令:', command.join(' '));

        // 4. 执行转码命令
        ffmpeg.setProgress(({ ratio }) => {
            const percentage = Math.round(ratio * 100);
            progressCallback({ status: 'transcoding', text: `视频合成中... ${percentage}%`, percentage });
        });
        await ffmpeg.run(...command);
        ffmpeg.setProgress(() => {}); // 清除进度监听

        // 5. 读取结果文件
        progressCallback({ status: 'reading_result', text: '正在读取成品...' });
        const data = ffmpeg.FS('readFile', 'output.mp4');

        // 6. 清理虚拟文件系统中的图片
        progressCallback({ status: 'cleaning_up', text: '正在清理临时文件...' });
        for (let i = 0; i < images.length; i++) {
            ffmpeg.FS('unlink', `img${String(i).padStart(3, '0')}.png`);
        }

        return new Blob([data.buffer], { type: 'video/mp4' });
    }

    /**
     * 构建FFmpeg命令的核心函数 (使用 concat demuxer 方案)
     * @returns {Array<string>} FFmpeg命令参数数组
     */
    function buildCommand(config) {
        const resolution = config.resolution || '1080x1080';
        const [targetWidth, targetHeight] = resolution.split('x').map(Number);

        return [
            '-f', 'concat',
            '-safe', '0', // 允许在concat文件中使用相对路径
            '-i', 'inputs.txt', // 输入文件为我们生成的指令集
            '-vf', `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:-1:-1:black`,
            '-c:v', 'libx264',
            '-r', '30', // 帧率
            '-pix_fmt', 'yuv420p', // 像素格式，确保最大兼容性
            '-y', // 覆盖已存在的文件
            'output.mp4'
        ];
    }

    /**
     * 生成视频的核心函数
     * @param {Array} images - 包含 { dataUrl, caption } 的图片对象数组
     * @param {Object} config - 视频配置
     * @param {Function} progressCallback - 进度回调
     * @returns {Blob} - 生成的视频文件Blob
     */
    async function generate(images, config, progressCallback) {
        progressCallback({ status: 'loading_ffmpeg', text: '正在加载FFmpeg核心...' });
        const ffmpeg = await FFmpegLoader.load(({ ratio }) => {
            const percentage = Math.round(ratio * 100);
            progressCallback({ status: 'loading_ffmpeg', text: `加载中... ${percentage}%`, percentage });
        });

        progressCallback({ status: 'writing_files', text: '正在写入图片素材...', percentage: 0 });
        let concatFileContent = '';
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const fileName = `img${String(i).padStart(3, '0')}.png`;
            ffmpeg.FS('writeFile', fileName, await fetchFile(img.dataUrl));
            
            const isScreenshot = img.caption.includes('视频截图');
            const duration = isScreenshot ? config.screenshotDuration : config.commentDuration;
            concatFileContent += `file '${fileName}'\n`;
            concatFileContent += `duration ${duration}\n`;

            const percentage = Math.round(((i + 1) / images.length) * 100);
            progressCallback({ status: 'writing_files', text: `写入中... (${i + 1}/${images.length})`, percentage });
        }

        // 写入指令文件
        ffmpeg.FS('writeFile', 'inputs.txt', concatFileContent);

        progressCallback({ status: 'generating_command', text: '正在生成处理指令...' });
        const command = buildCommand(config); // 新的指令构建方法
        console.log('执行FFmpeg指令:', command.join(' '));

        ffmpeg.setProgress(({ time }) => {
            // 对于concat, ratio可能不准，改用time来估算进度
            const totalDuration = images.reduce((acc, img) => {
                const isScreenshot = img.caption.includes('视频截图');
                return acc + (isScreenshot ? config.screenshotDuration : config.commentDuration);
            }, 0);
            const percentage = Math.min(100, Math.round((time / totalDuration) * 100));
            progressCallback({ status: 'transcoding', text: `视频合成中... ${percentage}%`, percentage });
        });
        await ffmpeg.run(...command);
        ffmpeg.setProgress(() => {});

        progressCallback({ status: 'reading_result', text: '正在读取成品...' });
        const data = ffmpeg.FS('readFile', 'output.mp4');

        progressCallback({ status: 'cleaning_up', text: '正在清理临时文件...' });
        for (let i = 0; i < images.length; i++) {
            const fileName = `img${String(i).padStart(3, '0')}.png`;
            ffmpeg.FS('unlink', fileName);
        }
        ffmpeg.FS('unlink', 'inputs.txt');

        return new Blob([data.buffer], { type: 'video/mp4' });
    }

    return {
        generate,
    };
})();