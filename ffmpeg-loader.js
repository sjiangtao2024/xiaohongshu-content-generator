/**
 * @file FFmpeg加载器模块
 * @description 负责加载FFmpeg.wasm核心库，并提供单例模式确保只加载一次。
 */

const FFmpegLoader = (() => {
    let ffmpegInstance = null;

    async function load(progressCallback) {
        if (ffmpegInstance) {
            return ffmpegInstance;
        }

        const { createFFmpeg } = FFmpeg;
        const ffmpeg = createFFmpeg({
            // 使用 unpkg CDN 加载核心文件
            corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
            log: true, // 在控制台输出日志，方便调试
            progress: progressCallback, // 进度回调
        });

        try {
            await ffmpeg.load();
            ffmpegInstance = ffmpeg;
            return ffmpegInstance;
        } catch (error) {
            console.error("FFmpeg failed to load", error);
            throw error; // 抛出错误，让调用者处理
        }
    }

    return {
        load,
    };
})();