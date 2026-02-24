# ポモドーロタイマー Webアプリケーション アーキテクチャ設計書

## 📋 概要

このドキュメントは、FlaskとHTML/CSS/JavaScriptを使用したポモドーロタイマーWebアプリケーションの総合的なアーキテクチャ設計を記述しています。

**UIモック仕様：**
- タイマー表示（25:00形式）
- 「開始」「リセット」ボタン
- 本日の進捗表示（完了数、集中時間）
- ステータス表示（作業中など）

---

## 🏗️ 全体アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────────┐
│                    ブラウザ（クライアント）                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │         HTML/CSS/JavaScript                     │   │
│  │  ├─ UI レンダリング（count down 表示）          │   │
│  │  ├─ WebSocket通信                              │   │
│  │  └─ ローカルストレージ（状態キャッシュ）        │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────┬──────────────────────────────────────┘
                    │ HTTP/WebSocket
┌───────────────────▼──────────────────────────────────────┐
│                Flaskアプリケーション                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ API層（routes.py）                             │   │
│  │  └─ RESTエンドポイント                          │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ ビジネスロジック層（services/）                 │   │
│  │  ├─ timer_service.py                          │   │
│  │  └─ stats_service.py                          │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ データアクセス層（repositories/）                │   │
│  │  └─ session_repository.py                     │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────┬──────────────────────────────────────┘
                    │ SQL
┌───────────────────▼──────────────────────────────────────┐
│                      データベース                         │
│  ├─ sessions テーブル                                   │
│  └─ daily_stats テーブル                                │
└───────────────────────────────────────────────────────────┘
```

---

## 📁 ディレクトリ構成

```
1.pomodoro/
├── app.py                            # Flask アプリケーションエントリポイント
├── config.py                         # 環境設定（本番/テスト/開発）
├── requirements.txt                  # 依存パッケージ一覧
├── wsgi.py                          # WSGI設定（本番オプション）
│
├── src/
│   ├── __init__.py
│   ├── models.py                     # SQLAlchemyモデル定義
│   ├── schemas.py                    # リクエスト/レスポンスバリデーション
│   │
│   ├── services/                     # ビジネスロジック層
│   │   ├── __init__.py
│   │   ├── timer_service.py          # タイマー関連のロジック
│   │   └── stats_service.py          # 統計情報の計算ロジック
│   │
│   ├── repositories/                 # データアクセス層
│   │   ├── __init__.py
│   │   ├── base.py                   # 抽象ベースクラス
│   │   └── session_repository.py     # セッションデータアクセス
│   │
│   ├── api/                          # API層
│   │   ├── __init__.py
│   │   ├── routes.py                 # RESTエンドポイント定義
│   │   └── exceptions.py             # カスタム例外クラス
│   │
│   └── core/                         # 共通機能・インフラ
│       ├── __init__.py
│       ├── dependencies.py           # 依存性注入コンテナ
│       └── utils.py                  # ユーティリティ関数
│
├── static/
│   ├── css/
│   │   └── style.css                # スタイルシート（Flexbox/Grid対応）
│   └── js/
│       └── timer.js                 # クライアントサイドロジック
│
├── templates/
│   └── index.html                   # メインHTMLテンプレート
│
└── tests/                           # テストコード
    ├── __init__.py
    ├── conftest.py                  # pytest設定＆フィクスチャ定義
    │
    ├── unit/                        # ユニットテスト
    │   ├── test_timer_service.py
    │   ├── test_stats_service.py
    │   └── test_models.py
    │
    ├── integration/                 # 統合テスト
    │   ├── test_api_routes.py
    │   └── test_repositories.py
    │
    └── fixtures/
        └── sample_data.py            # テスト用ダミーデータ
```

---

## 🔧 各層の責務

### 1. API層（routes.py）

**責務：** HTTPリクエスト/レスポンスの処理、入力バリデーション、ステータスコード管理

```python
# エンドポイント一覧
POST   /api/timer/start       # タイマー開始
POST   /api/timer/pause       # 一時停止
POST   /api/timer/resume      # 再開
POST   /api/timer/reset       # リセット
GET    /api/timer/status      # 現在の状態取得
GET    /api/stats/today       # 本日の統計情報
GET    /api/stats/history     # 過去の統計情報
```

**特徴：**
- 入力値の検証（スキーマ利用）
- エラーハンドリング
- レスポンス形式の統一
- HTTPステータスコードの適切な割り当て

### 2. ビジネスロジック層（services/）

**責務：** ドメインロジックの実装、状態遷移管理、計算処理

**TimerService の主なメソッド**
```python
start_session(user_id: str) -> dict
pause_session(session_id: str) -> dict
resume_session(session_id: str) -> dict
reset_session(session_id: str) -> dict
calculate_remaining_seconds(elapsed: int) -> int
is_session_complete(session: dict) -> bool
```

**StatsService の主なメソッド**
```python
get_today_stats(user_id: str) -> dict
record_completed_session(session: dict) -> dict
get_session_history(user_id: str, days: int) -> list
```

**特徴：**
- ビジネスロジックのみを責務
- 外部依存性なし（純粋関数が中心）
- テスト可能な設計
- リケースしやすい構造

### 3. データアクセス層（repositories/）

**責務：** データベースアクセスの抽象化、永続化処理

```python
# 抽象インターフェース（SessionRepository）
save_session(session: dict) -> dict
get_session(session_id: str) -> dict
update_session(session_id: str, data: dict) -> dict
delete_session(session_id: str) -> bool
list_sessions(user_id: str, limit: int) -> list
```

**実装パターン：**
- **本番環境：** RealSessionRepository（データベース接続）
- **テスト環境：** FakeSessionRepository（メモリベース）

### 4. モデル層（models.py）

**主要なモデル**

```python
class Session(Base):
    """セッション情報"""
    id: str
    user_id: str
    started_at: datetime
    ended_at: datetime
    status: Enum['active', 'paused', 'completed']
    elapsed_seconds: int

class DailyStats(Base):
    """日ごとの統計情報"""
    id: str
    user_id: str
    date: date
    completed_sessions: int
    total_focus_minutes: int
    total_break_minutes: int
```

---

## 🎯 テスト性を高める設計パターン

### パターン1：依存性の注入（DI）

```python
# src/core/dependencies.py
class DIContainer:
    def __init__(self, config):
        self.config = config
    
    def get_timer_service(self) -> TimerService:
        repo = self._get_session_repository()
        return TimerService(repo)
    
    def _get_session_repository(self) -> SessionRepository:
        if self.config['TESTING']:
            return FakeSessionRepository()
        else:
            return RealSessionRepository(db)
```

**メリット：**
- テスト時に依存を置き換え可能
- ビジネスロジックが独立
- 環境によって実装を切り替え可能

### パターン2：抽象インターフェース

```python
# src/repositories/base.py
from abc import ABC, abstractmethod

class SessionRepository(ABC):
    @abstractmethod
    def save_session(self, session: dict) -> dict:
        pass
    
    @abstractmethod
    def get_session(self, session_id: str) -> dict:
        pass
```

**メリット：**
- インターフェースに基づく設計
- Mock/Stubの実装が容易
- 仮実装での開発に対応

### パターン3：設定の外部化

```python
# config.py
class Config:
    POMODORO_MINUTES = 25
    BREAK_MINUTES = 5
    DATABASE_URL = 'postgresql://...'

class TestConfig(Config):
    TESTING = True
    DATABASE_URL = 'sqlite:///:memory:'
    SQLALCHEMY_ECHO = True
```

**メリット：**
- 環境別の設定管理
- テスト環境用の特殊設定
- 本番環境の詳細を隠蔽

### パターン4：純粋関数

```python
# services/timer_service.py
def calculate_remaining_seconds(self, elapsed: int, duration: int) -> int:
    """純粋関数：入出力が明確で副作用なし"""
    return max(0, duration - elapsed)

def is_session_complete(self, remaining: int) -> bool:
    """テストが容易な純粋関数"""
    return remaining == 0
```

**メリット：**
- テストが単純
- 結果が予測可能
- デバッグが容易

### パターン5：テストダブル

```python
# tests/fixtures/fakes.py
class FakeSessionRepository(SessionRepository):
    def __init__(self):
        self.data = {}
    
    def save_session(self, session: dict) -> dict:
        self.data[session['id']] = session
        return session
    
    def get_session(self, session_id: str) -> dict:
        return self.data.get(session_id)
```

**メリット：**
- 外部依存なしでテスト実行
- テスト速度が高速
- 並列テスト実行が可能

---

## ✅ テスト実装ガイド

### ユニットテスト例

```python
# tests/unit/test_timer_service.py
import pytest
from src.services.timer_service import TimerService
from tests.fixtures.fakes import FakeSessionRepository

@pytest.fixture
def timer_service():
    repo = FakeSessionRepository()
    return TimerService(repo)

class TestTimerService:
    def test_calculate_remaining_seconds(self, timer_service):
        # Arrange
        elapsed = 300  # 5分
        
        # Act
        result = timer_service.calculate_remaining_seconds(elapsed)
        
        # Assert
        assert result == 1200  # 25分 - 5分 = 20分
    
    def test_session_complete(self, timer_service):
        result = timer_service.calculate_remaining_seconds(1500)
        assert timer_service.is_session_complete(result)
```

### 統合テスト例

```python
# tests/integration/test_api_routes.py
@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.app_context():
        yield app.test_client()

def test_start_timer_endpoint(client):
    # Act
    response = client.post('/api/timer/start')
    
    # Assert
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'active'
    assert data['remaining_seconds'] == 1500
```

### テストの実行

```bash
# すべてのテストを実行
pytest tests/

# カバレッジ測定
pytest tests/ --cov=src --cov-report=html

# 特定のテストのみ実行
pytest tests/unit/test_timer_service.py::TestTimerService::test_calculate_remaining_seconds
```

---

## 🔄 フロントエンド設計

### JavaScript構成（timer.js）

```javascript
class TimerController {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.sessionId = null;
        this.remainingSeconds = 1500;
    }
    
    async startSession() {
        const response = await this.apiClient.post('/api/timer/start');
        this.sessionId = response.id;
        this.updateUI(response);
        this.startCountdown();
    }
    
    startCountdown() {
        // 1秒ごとにUIを更新
        setInterval(() => {
            this.remainingSeconds--;
            this.updateTimeDisplay();
            
            if (this.remainingSeconds <= 0) {
                this.showNotification('セッション完了！');
            }
        }, 1000);
    }
    
    updateUI(sessionData) {
        // DOMの更新
    }
}
```

**特徴：**
- APIクライアントの分離で単体テスト容易
- イベント駆動設計
- ローカルストレージでオフライン対応

### UIコンポーネント

```html
<div class="timer-container">
    <h2 class="timer-display" id="timerDisplay">25:00</h2>
    <div class="button-group">
        <button class="btn btn-primary" id="startBtn">開始</button>
        <button class="btn btn-secondary" id="resetBtn">リセット</button>
    </div>
    <div class="stats">
        <div class="stat-item">
            <span class="label">完了</span>
            <span class="value" id="completedCount">4</span>
        </div>
        <div class="stat-item">
            <span class="label">集中時間</span>
            <span class="value" id="focusTime">1時間40分</span>
        </div>
    </div>
</div>
```

---

## 🚀 開発フロー

### 開発環境セットアップ

```bash
# 1. 仮想環境の作成
python -m venv venv
source venv/bin/activate

# 2. 依存パッケージのインストール
pip install -r requirements.txt

# 3. データベース初期化
flask db upgrade

# 4. 開発サーバー起動
flask run
```

### テスト駆動開発（TDD）フロー

```
1. テストを書く（RED）
   └─ 失敗するテストを作成
2. 最小限の実装で合格させる（GREEN）
3. コードをリファクタリング（REFACTOR）
4. 繰り返す
```

### CI/CDパイプライン例

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: pip install -r requirements.txt
      - run: pytest tests/ --cov=src --cov-report=xml
      - uses: codecov/codecov-action@v3
```

---

## 📊 テストカバレッジ目標

| レイヤー | ユニット | 統合 | 目標 |
|---------|----------|------|------|
| services/ | 100% | 95% | 95%+ |
| repositories/ | 90% | 100% | 95%+ |
| api/routes | 80% | 100% | 90%+ |
| models | 100% | - | 100% |
| **全体** | **90%** | **95%** | **90%+** |

---

## 📦 必須パッケージ（requirements.txt）

```
Flask==3.0.0
Flask-SQLAlchemy==3.1.1
python-dotenv==1.0.0
gunicorn==21.2.0

# テスト
pytest==7.4.0
pytest-cov==4.1.0
pytest-mock==3.11.1
factory-boy==3.3.0

# データベース
alembic==1.12.0
psycopg2-binary==2.9.7

# 開発
black==23.9.1
flake8==6.1.0
mypy==1.4.1
```

---

## 🔍 デバッグ・運用

### ログ設定例

```python
import logging

logging.basicConfig(
    level=logging.DEBUG if app.debug else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
```

### エラーハンドリング

```python
# src/api/exceptions.py
class TimerException(Exception):
    """タイマー関連の基本例外"""
    pass

class SessionNotFoundError(TimerException):
    """セッションが見つからない"""
    pass

class InvalidSessionStateError(TimerException):
    """無効なセッション状態"""
    pass
```

---

## 📝 まとめ：設計のメリット

✅ **テスト性**
- レイヤー分離により各層を独立してテスト
- 依存性注入で環境を切り替え可能

✅ **保守性**
- 責務の明確な分離
- 変更の影響範囲を限定

✅ **拡張性**
- リポジトリパターンでDB切り替え可能
- サービス層にビジネスロジック追加

✅ **スケーラビリティ**
- マイクロサービス化の準備
- 非同期処理への拡張が容易

✅ **開発効率**
- 並列開発が可能
- テストコード量の最小化

---

**作成日：** 2026年2月24日  
**ステータス：** 設計確定版
