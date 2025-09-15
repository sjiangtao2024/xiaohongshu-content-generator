// ===================================================================================
// MODULE: UI CONTROLLER
// ===================================================================================

class UIController {
    constructor() {
        // 图片组数据
        this.imageGroups = [];
        this.currentPreviewIndex = 0;
        
        // DOM元素缓存
        this.cacheDOMElements();
        
        // 初始化事件监听器
        this.initEventListeners();
    }

    // 缓存DOM元素
    cacheDOMElements() {
        this.markdownInput = document.getElementById('markdownInput');
        this.jsonFileInput = document.getElementById('jsonFileInput');
        this.fileNameDisplay = document.getElementById('fileName');
        this.generateBtn = document.getElementById('generateBtn');
        this.outputContainer = document.getElementById('output');
        this.loader = document.getElementById('loader');
        this.placeholderText = document.getElementById('placeholderText');
        this.placeholderContainer = document.getElementById('placeholderContainer');
        this.outputTitle = document.getElementById('outputTitle');
        this.imageModal = document.getElementById('imageModal');
        this.modalImage = document.getElementById('modalImage');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.downloadZipBtn = document.getElementById('downloadZipBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.videoFileInput = document.getElementById('videoFileInput');
        this.videoFileName = document.getElementById('videoFileName');
        this.videoContainer = document.getElementById('videoContainer');
        this.videoPlayer = document.getElementById('videoPlayer');
        this.screenshotCountInput = document.getElementById('screenshotCount');
        this.uniformCaptureBtn = document.getElementById('uniformCaptureBtn');
        this.randomCaptureBtn = document.getElementById('randomCaptureBtn');
    }

    // 初始化事件监听器
    initEventListeners() {
        this.jsonFileInput.addEventListener('change', (e) => this.handleJsonFileUpload(e));
        this.videoFileInput.addEventListener('change', (e) => this.handleVideoUpload(e));
        this.generateBtn.addEventListener('click', () => this.handleCommentGeneration());
        this.uniformCaptureBtn.addEventListener('click', () => this.handleScreenshotGeneration('uniform'));
        this.randomCaptureBtn.addEventListener('click', () => this.handleScreenshotGeneration('random'));
        this.downloadZipBtn.addEventListener('click', () => this.handleZipDownload());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.imageModal.addEventListener('click', (e) => {
            if (e.target.id === 'imageModal') this.closeModal();
        });
        this.prevBtn.addEventListener('click', () => this.showPrevImage());
        this.nextBtn.addEventListener('click', () => this.showNextImage());
    }

    // 处理JSON文件上传
    handleJsonFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.markdownInput.value = e.target.result;
                this.fileNameDisplay.textContent = `已加载: ${file.name}`;
            };
            reader.readAsText(file);
        }
    }

    // 处理视频上传
    handleVideoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const videoURL = URL.createObjectURL(file);
            this.videoPlayer.src = videoURL;
            this.videoContainer.classList.remove('hidden');
            this.videoFileName.textContent = `已加载: ${file.name}`;
        }
    }

    // 处理键盘事件
    handleKeyDown(e) {
        if (e.key === "ArrowLeft") {
            this.showPrevImage();
        } else if (e.key === "ArrowRight") {
            this.showNextImage();
        } else if (e.key === "Escape") {
            this.closeModal();
        }
    }

    // 显示加载器
    showLoader() {
        this.placeholderContainer.innerHTML = '';
        this.placeholderContainer.appendChild(this.loader);
        this.loader.classList.remove('hidden');
    }

    // 隐藏加载器
    hideLoader() {
        if (this.imageGroups.length === 0) {
            this.placeholderContainer.innerHTML = '';
            this.placeholderContainer.appendChild(this.placeholderText);
        }
        this.loader.classList.add('hidden');
    }

    // 更新输出标题
    updateOutputTitle() {
        const count = this.imageGroups.reduce((acc, group) => acc + group.images.length, 0);
        this.outputTitle.textContent = `3. 预览与拖拽 (共 ${count} 张)`;
    }

    // 渲染所有图片组
    renderAllGroups() {
        this.outputContainer.innerHTML = ''; // 清空所有内容
        this.outputContainer.appendChild(this.placeholderContainer);
        this.placeholderContainer.style.display = this.imageGroups.length === 0 ? 'flex' : 'none';
        
        let flatImageIndex = 0;

        this.imageGroups.forEach((group, groupIndex) => {
            const groupWrapper = document.createElement('div');
            groupWrapper.className = 'image-group';

            const header = document.createElement('div');
            header.className = 'group-header';
            
            const title = document.createElement('span');
            title.className = 'group-title';
            title.textContent = group.title;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-group-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = () => {
                this.imageGroups.splice(groupIndex, 1);
                this.renderAllGroups();
            };

            header.appendChild(title);
            header.appendChild(deleteBtn);
            groupWrapper.appendChild(header);

            const imageGrid = document.createElement('div');
            imageGrid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4';

            group.images.forEach(imageInfo => {
                const localIndex = flatImageIndex;
                const wrapper = document.createElement('div');
                wrapper.className = 'text-center';
                const img = document.createElement('img');
                img.src = imageInfo.dataUrl;
                img.alt = imageInfo.caption;
                img.title = `${imageInfo.caption} - 点击放大`;
                img.className = "w-full h-auto rounded-lg shadow-md mb-1 transition-transform transform hover:scale-105 cursor-pointer";
                img.addEventListener('click', () => this.openModal(localIndex));
                
                const caption = document.createElement('p');
                caption.className = 'text-xs text-gray-600 font-semibold';
                caption.textContent = imageInfo.caption;
                
                wrapper.appendChild(img);
                wrapper.appendChild(caption);
                imageGrid.appendChild(wrapper);
                flatImageIndex++;
            });

            groupWrapper.appendChild(imageGrid);
            this.outputContainer.appendChild(groupWrapper);
        });

        this.updateOutputTitle();
    }

    // 打开模态框
    openModal(index) {
        const flatImages = this.imageGroups.flatMap(group => group.images.map(img => img.dataUrl));
        if (flatImages.length === 0) return;
        this.currentPreviewIndex = index;
        this.modalImage.src = flatImages[this.currentPreviewIndex];
        this.imageModal.classList.remove('hidden');
        this.imageModal.classList.add('flex');
        document.body.classList.add('modal-open');
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    // 关闭模态框
    closeModal() {
        this.imageModal.classList.add('hidden');
        this.imageModal.classList.remove('flex');
        document.body.classList.remove('modal-open');
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    // 显示上一张图片
    showPrevImage() {
        const flatImages = this.imageGroups.flatMap(group => group.images.map(img => img.dataUrl));
        this.currentPreviewIndex = (this.currentPreviewIndex - 1 + flatImages.length) % flatImages.length;
        this.modalImage.src = flatImages[this.currentPreviewIndex];
    }

    // 显示下一张图片
    showNextImage() {
        const flatImages = this.imageGroups.flatMap(group => group.images.map(img => img.dataUrl));
        this.currentPreviewIndex = (this.currentPreviewIndex + 1) % flatImages.length;
        this.modalImage.src = flatImages[this.currentPreviewIndex];
    }

    // 检测输入格式类型
    detectInputFormat(inputText) {
        const trimmedText = inputText.trim();
        if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
            return 'json';
        }
        return 'unknown';
    }

    // 处理评论生成
    async handleCommentGeneration() {
        const inputText = this.markdownInput.value.trim();
        if (!inputText) {
            alert('请输入或上传评论内容！');
            return;
        }
        
        this.showLoader();

        try {
            let comments;
            
            // 自动检测输入格式
            const formatType = this.detectInputFormat(inputText);
            
            if (formatType === 'json') {
                // JSON格式
                comments = CommentParser.parseJSONComments(inputText);
            } else {
                throw new Error('无法识别输入格式，请使用JSON格式。');
            }
            
            // 移除了调试信息
            if (comments.length === 0) throw new Error("未找到有效评论，请检查格式。");
            
            const commentsWithLayout = comments.map(comment => CommentParser.calculateLayout(comment));
            const commentChunks = CommentParser.chunkifyComments(commentsWithLayout);

            const imagePromises = commentChunks.map((chunk, index) => {
                const svgString = ImageGenerator.generateSVG(chunk);
                const bgUrl = AppConstants.backgroundImages[Math.floor(Math.random() * AppConstants.backgroundImages.length)];
                return Utils.convertSvgToPng(svgString, bgUrl).then(dataUrl => ({
                    dataUrl,
                    caption: `评论图 ${index + 1} (含 ${chunk.length} 条)`
                }));
            });

            const newImageGroup = await Promise.all(imagePromises);
            this.imageGroups.push({title: `评论图组 (共 ${newImageGroup.length} 张)`, images: newImageGroup});
            this.renderAllGroups();
            this.fileNameDisplay.textContent = `生成完毕！共 ${comments.length} 条主评论，已生成 ${newImageGroup.length} 张图片。`;

        } catch (error) {
            console.error('评论图生成失败:', error);
            alert(error.message || '生成失败，请检查格式。');
        } finally {
             this.hideLoader();
        }
    }

    // 处理截图生成
    async handleScreenshotGeneration(mode) {
         if (!this.videoPlayer.src || !this.videoPlayer.duration) {
            alert('请先上传一个有效的视频文件。');
            return;
        }
        
        this.showLoader();

        try {
            const count = parseInt(this.screenshotCountInput.value, 10);
            const duration = this.videoPlayer.duration;
            const timestamps = VideoProcessor.generateTimestamps(mode, count, duration);
            
            const newImages = [];
            for(let i = 0; i < timestamps.length; i++) {
                const time = timestamps[i];
                const dataUrl = await VideoProcessor.captureFrameAt(this.videoPlayer, time);
                newImages.push({
                    dataUrl,
                    caption: `视频截图 ${i + 1}`
                });
            }

            this.imageGroups.push({title: `视频截图组 (共 ${newImages.length} 张)`, images: newImages});
            this.renderAllGroups();
            this.videoFileName.textContent = `截取完毕！已生成 ${newImages.length} 张截图。`;

        } catch (error) {
             console.error('视频截图失败:', error);
             alert('视频截图失败，请确保视频格式受浏览器支持。');
        } finally {
            this.hideLoader();
        }
    }

    // 处理ZIP下载
    async handleZipDownload() {
        const allImages = this.imageGroups.flatMap(group => group.images);
        if (allImages.length === 0) {
            alert('预览区没有任何图片可供下载。');
            return;
        }

        const btn = this.downloadZipBtn;
        const originalText = btn.textContent;
        btn.textContent = '正在打包...';
        btn.disabled = true;

        try {
            const zip = new JSZip();
            for (let i = 0; i < allImages.length; i++) {
                const img = allImages[i];
                const response = await fetch(img.dataUrl);
                const blob = await response.blob();
                // 使用更明确的文件名和注释
                zip.file(`image_${i + 1}.png`, blob, {
                    compression: 'DEFLATE',
                    compressionOptions: {
                        level: 6
                    },
                    comment: 'Generated by 小红书内容生成器',
                    date: new Date()
                });
            }

            // 使用更兼容的生成选项
            const content = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 6
                },
                platform: 'DOS',
                mimeType: 'application/zip',
                comment: '小红书内容生成器打包文件'
            });
            
            // 创建一个临时的URL对象用于下载
            const url = window.URL.createObjectURL(content);
            
            // 创建一个隐藏的iframe来处理下载
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = '小红书图片.zip';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            
            // 触发下载
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // 清理资源
            setTimeout(() => {
                document.body.removeChild(iframe);
                window.URL.revokeObjectURL(url);
            }, 100);

        } catch(error) {
            console.error("打包ZIP失败:", error);
            alert("打包下载失败，请重试。");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

// 导出UI控制器类
window.UIController = UIController;