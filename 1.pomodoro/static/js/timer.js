/**
 * ポモドーロタイマー JavaScript
 * ステップ1: 最小動作プロトタイプ
 */

class PomodoroTimer {
    constructor() {
        // DOM要素の取得
        this.timerDisplay = document.getElementById('timer-display');
        this.statusText = document.getElementById('status-text');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.completedCount = document.getElementById('completed-count');
        this.totalTime = document.getElementById('total-time');
        
        // 状態管理
        this.timeLeft = 25 * 60; // 25分（秒単位）
        this.isRunning = false;
        this.intervalId = null;
        
        // 進捗データ
        this.pomodorosCompleted = 0;
        this.totalMinutes = 0;
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 初期表示
        this.updateDisplay();
        this.loadProgress();
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
    }
    
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.startBtn.textContent = '一時停止';
        this.statusText.textContent = '作業中';
        
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.startBtn.textContent = '開始';
        this.statusText.textContent = '一時停止中';
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    tick() {
        if (this.timeLeft > 0) {
            this.timeLeft--;
            this.updateDisplay();
        } else {
            this.complete();
        }
    }
    
    complete() {
        this.pauseTimer();
        
        // 完了数を増やす
        this.pomodorosCompleted++;
        this.totalMinutes += 25;
        
        // 進捗を更新して保存
        this.updateProgressDisplay();
        this.saveProgress();
        
        // 通知を表示
        this.showNotification();
        
        // タイマーをリセット
        this.timeLeft = 25 * 60;
        this.updateDisplay();
        this.statusText.textContent = '完了！';
    }
    
    resetTimer() {
        this.pauseTimer();
        this.timeLeft = 25 * 60;
        this.updateDisplay();
        this.statusText.textContent = '準備完了';
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    updateProgressDisplay() {
        this.completedCount.textContent = this.pomodorosCompleted;
        
        // 集中時間の表示
        if (this.totalMinutes < 60) {
            this.totalTime.textContent = `${this.totalMinutes}分`;
        } else {
            const hours = Math.floor(this.totalMinutes / 60);
            const minutes = this.totalMinutes % 60;
            this.totalTime.textContent = `${hours}時間${minutes}分`;
        }
    }
    
    showNotification() {
        // ブラウザ通知をリクエスト
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ポモドーロ完了！', {
                body: '25分間お疲れ様でした。休憩しましょう。',
                icon: '/static/favicon.ico'
            });
        }
        
        // アラート表示
        alert('時間になりました！\n25分間お疲れ様でした。');
    }
    
    // ローカルストレージに進捗を保存
    saveProgress() {
        const today = new Date().toDateString();
        const data = {
            date: today,
            completed: this.pomodorosCompleted,
            totalMinutes: this.totalMinutes
        };
        localStorage.setItem('pomodoroProgress', JSON.stringify(data));
    }
    
    // ローカルストレージから進捗を読み込み
    loadProgress() {
        const stored = localStorage.getItem('pomodoroProgress');
        if (stored) {
            const data = JSON.parse(stored);
            const today = new Date().toDateString();
            
            // 今日のデータなら復元
            if (data.date === today) {
                this.pomodorosCompleted = data.completed || 0;
                this.totalMinutes = data.totalMinutes || 0;
                this.updateProgressDisplay();
            }
        }
        
        // 通知の許可をリクエスト
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// ページ読み込み時にタイマーを初期化
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
