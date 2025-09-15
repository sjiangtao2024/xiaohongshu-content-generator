import json
import argparse
import os
import subprocess
import sys
import re
from datetime import datetime

# --- 關鍵詞常量 ---
SPAM_KEYWORDS = [
    "翻墙", "翻牆", "VPN", "软件", "軟體", "免费", "免費",
    "推广", "推廣", "福利", "赚钱", "賺錢", "加微", "v信",
    "V信", "Q群", "扣群", "奈飞", "奈飛", "chatgpt", "gpt-4",
    "好人一生平安"
]

SENSITIVE_KEYWORDS = [
    # 歷史事件
    '六四', '天安门事件', '天安門事件', '8964',
    # 被禁止的團體或話題
    '法轮功', '法輪功', '大法好',
    # 分裂主義相關
    '台独', '台獨', '臺独', '臺獨',
    '台湾独立', '台灣獨立', '臺灣獨立',
    '藏独', '藏獨', '疆独', '疆獨', '港独', '港獨',
    '台湾国', '台灣國', '臺灣國',
    '台湾民主共和国', '臺灣民主共和國', '台灣民主共和國',
    '台湾共和国', '台灣共和國', '臺灣共和國',
    '中华民国台湾', '中華民國台灣', '中華民國臺灣',
    '中华民国', '中華民國', '中国民国', '中國民國',
    '台湾民国', '臺灣民國',
    '中华人民共和国', '中華人民共和國', '中国人民共和国', '中國人民共和國',
    '中华人民共合国', '中華人民共合國', '中国人民共合国', '中國人民共合國',
    # 香港示威相關口號
    '光复香港', '光復香港', '时代革命', '時代革命',
    # 對國家或政黨的攻擊性詞彙
    '共匪', '赤匪', '支那', '中国共产党黑暗', '中國共產黨黑暗', '中国共产党灭亡', '中國共產黨滅亡',
    # 媒體相關
    '民报', '民報',
    # 對領導人的不敬稱呼或代稱
    '维尼', '維尼', '包子', '习大大', '習大大', '习近平', '習近平'
]

# --- 過濾與審查函數 ---

def contains_keyword(text, keywords):
    """通用關鍵詞檢測函數"""
    if not text:
        return False
    lower_text = text.lower()
    for keyword in keywords:
        if keyword.lower() in lower_text:
            return True
    return False

def censor_keywords(input_string, keywords):
    """在輸入字串中查找所有指定的關鍵詞（不區分大小寫），並將其替換為等長的'*'。只替換敏感部分，不影響其他字符。"""
    if not input_string:
        return input_string
    # 按長度降序排序，優先匹配長關鍵詞 (例如 "台湾独立" vs "台独")
    sorted_keywords = sorted(keywords, key=len, reverse=True)
    for keyword in sorted_keywords:
        # 使用正則表達式進行不區分大小寫的子字串替換
        pattern = re.compile(re.escape(keyword), re.IGNORECASE)
        input_string = pattern.sub('*' * len(keyword), input_string)
    return input_string

def is_spam_comment(text, author):
    """檢查評論文本或作者名是否為廣告或垃圾訊息"""
    if contains_keyword(text, SPAM_KEYWORDS) or contains_keyword(author, SPAM_KEYWORDS):
        return True
    
    if text:
        url_pattern = re.compile(
            r'https?://[^\s/$.?#].[^\s]*|'
            r'www\.[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b|'
            r'\b[a-zA-Z0-9-]+\.(com|net|org|shop|xyz|cn|top|dev|app)\b'
        )
        if url_pattern.search(text):
            return True
            
    return False

def process_comment(comment):
    """
    處理單個評論對象：過濾、審查、格式化。
    返回處理後的評論字典，如果被過濾則返回 None。
    """
    comment_text = comment.get('text')
    author_name = comment.get('author', '')

    if author_name.startswith('@'):
        author_name = author_name[1:]

    # 1. 檢查是否為垃圾評論 (內容或用戶名)，是則跳過
    if is_spam_comment(comment_text, author_name):
        return None, 'spam'
    
    # 2. 檢查評論內容是否政治敏感，是則跳過
    if contains_keyword(comment_text, SENSITIVE_KEYWORDS):
        return None, 'sensitive'
    
    # 3. 檢查並審查用戶名 (局部替換)
    original_author = author_name
    censored_author = censor_keywords(author_name, SENSITIVE_KEYWORDS)
    was_censored = (original_author != censored_author)
    
    timestamp = comment.get('timestamp')
    readable_datetime = None
    if isinstance(timestamp, (int, float)):
        readable_datetime = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

    comment_data = {
        'id': comment.get('id'),
        'parent': comment.get('parent'),
        'text': comment_text,
        'like_count': comment.get('like_count'),
        'author': censored_author,
        'author_id': comment.get('author_id'),
        'author_is_uploader': comment.get('author_is_uploader'),
        'timestamp': timestamp,
        'datetime': readable_datetime,
        'replies': [] 
    }
    
    return comment_data, 'censored_author' if was_censored else 'clean'

# --- 主函數 ---

def download_and_convert_yt_info(video_url, output_file_path=None):
    """
    使用 yt-dlp 下載影片資訊和評論，然後將其轉換為帶有層級關係的簡化格式並儲存。
    """
    try:
        print(f"正在從 {video_url} 下載資訊和評論...")
        
        command = ['yt-dlp', '--skip-download', '--get-comments', '--dump-json', video_url]
        
        result = subprocess.run(
            command, capture_output=True, text=True, encoding='utf-8', check=True
        )
        
        data = json.loads(result.stdout)
        
        # --- 資料轉換邏輯 ---
        threaded_comments = []
        if data.get('comments'):
            comments_map = {}
            stats = {'spam': 0, 'sensitive': 0, 'censored_author': 0}

            # 第一遍：處理和過濾所有評論（包括主評論和回覆）
            for comment in data['comments']:
                processed_comment, status = process_comment(comment)
                if processed_comment:
                    comments_map[processed_comment['id']] = processed_comment
                    if status != 'clean':
                        stats[status] += 1
                elif status in stats:
                    stats[status] += 1
            
            print("\n--- 過濾統計 ---")
            if stats['spam'] > 0:
                print(f"已過濾掉 {stats['spam']} 則疑似廣告評論。")
            if stats['sensitive'] > 0:
                print(f"已因內容敏感而過濾掉 {stats['sensitive']} 則評論。")
            if stats['censored_author'] > 0:
                print(f"已審查 {stats['censored_author']} 個包含敏感詞的用戶名。")
            print("------------------")

            # 第二遍：建構層級結構
            for comment_id, comment_obj in comments_map.items():
                parent_id = comment_obj.get('parent')
                if parent_id and parent_id != 'root':
                    parent_comment = comments_map.get(parent_id)
                    if parent_comment:
                        # 確保 'replies' 鍵存在
                        if 'replies' not in parent_comment:
                            parent_comment['replies'] = []
                        parent_comment['replies'].append(comment_obj)
                else:
                    threaded_comments.append(comment_obj)

        converted_data = {
            'id': data.get('id'),
            'title': data.get('title'),
            'description': data.get('description'),
            'upload_date': data.get('upload_date'),
            'uploader': data.get('uploader'),
            'uploader_id': data.get('uploader_id'),
            'channel': data.get('channel'),
            'duration': data.get('duration'),
            'view_count': data.get('view_count'),
            'like_count': data.get('like_count'),
            'comment_count': data.get('comment_count'),
            'comments': threaded_comments
        }
        
        # --- 檔案儲存邏輯 ---
        if not output_file_path:
            video_id = data.get('id', 'video')
            output_file_path = f"{video_id}_formatted.json"

        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(converted_data, f, ensure_ascii=False, indent=2)

        print(f"\n轉換成功！檔案已儲存至: {output_file_path}")

    except FileNotFoundError:
        print("錯誤: 'yt-dlp' 命令未找到。", file=sys.stderr)
        print("請確保您已經安裝了 yt-dlp 並且它在您的系統 PATH 環境變數中。", file=sys.stderr)
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print("錯誤: yt-dlp 執行失敗。", file=sys.stderr)
        print("这可能是由於無效的 URL 或網路問題導致的。", file=sys.stderr)
        print(f"yt-dlp 錯誤輸出:\n{e.stderr}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print("錯誤: 無法解析 yt-dlp 輸出的 JSON 資料。", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"發生未知錯誤: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='下載 YouTube 影片資訊和評論，並將其轉換為簡化的 JSON 格式。')
    parser.add_argument('video_url', help='YouTube 影片的 URL。')
    parser.add_argument('-o', '--output_file', help='輸出的簡化後 JSON 檔案路徑。(可選, 預設將根據影片ID命名)')
    
    args = parser.parse_args()

    download_and_convert_yt_info(args.video_url, args.output_file)

