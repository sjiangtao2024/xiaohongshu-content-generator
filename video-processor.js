// ===================================================================================
// MODULE: VIDEO PROCESSING FUNCTIONS
// ===================================================================================

class VideoProcessor {
    // 在指定时间截取视频帧
    static captureFrameAt(videoPlayer, time) {
        return new Promise((resolve, reject) => {
            if (videoPlayer.readyState < 2) {
                 videoPlayer.onloadeddata = () => VideoProcessor.captureFrameAt(videoPlayer, time).then(resolve).catch(reject);
                 videoPlayer.load();
                 return;
            }
            
            const onSeeked = () => {
                videoPlayer.removeEventListener('seeked', onSeeked);
                
                const targetWidth = 1080;
                const targetHeight = 1080;
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, targetWidth, targetHeight);

                const videoRatio = videoPlayer.videoWidth / videoPlayer.videoHeight;
                const targetRatio = targetWidth / targetHeight;
                let drawWidth, drawHeight, x, y;

                if (videoRatio > targetRatio) {
                    drawWidth = targetWidth;
                    drawHeight = drawWidth / videoRatio;
                    x = 0;
                    y = (targetHeight - drawHeight) / 2;
                } else {
                    drawHeight = targetHeight;
                    drawWidth = drawHeight * videoRatio;
                    y = 0;
                    x = (targetWidth - drawWidth) / 2;
                }
                
                ctx.drawImage(videoPlayer, x, y, drawWidth, drawHeight);
                resolve(canvas.toDataURL('image/png'));
            };
            
            videoPlayer.addEventListener('seeked', onSeeked);
            videoPlayer.onerror = (e) => reject(e);
            videoPlayer.currentTime = time;
        });
    }

    // 生成截图时间戳
    static generateTimestamps(mode, count, duration) {
        let timestamps = [];

        if(mode === 'uniform') {
            const interval = duration / (count + 1);
            for (let i = 1; i <= count; i++) {
                timestamps.push(interval * i);
            }
        } else { // random
            for (let i = 0; i < count; i++) {
                timestamps.push(Math.random() * duration);
            }
            timestamps.sort((a, b) => a - b);
        }
        
        return timestamps;
    }
}

// 导出视频处理器类
window.VideoProcessor = VideoProcessor;