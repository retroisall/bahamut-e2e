# 巴哈姆特 E2E 自動化測試專案

## 專案簡介

本專案針對巴哈姆特電玩資訊站（https://www.gamer.com.tw/）旗下四個核心頁面進行端對端（E2E）自動化測試。採用 **Selenium WebDriver + JavaScript (Node.js)** 實作，架構遵循 **Page Object Model (POM)** 設計模式，確保測試程式碼的可維護性與可擴充性。

測試目標為驗證各頁面的核心 UI 元素是否正常載入，屬於 MVP 範圍的核心元素存在性驗證（SCOPE REDUCTION）。

---

## 系統需求

| 項目 | 版本需求 |
|------|----------|
| Node.js | v18.0.0 以上 |
| npm | v9.0.0 以上 |
| Google Chrome | 最新穩定版（建議 v120+） |
| ChromeDriver | 必須與 Chrome 版本相符 |
| 作業系統 | Windows 10/11、macOS 12+、Ubuntu 20.04+ |

> **ChromeDriver 版本對應**：請至 [ChromeDriver 下載頁](https://chromedriver.chromium.org/downloads) 或使用 `npx chromedriver` 自動管理版本。

---

## 安裝步驟

### 1. 複製或進入專案目錄

```bash
cd C:/Users/郭峻瑋/bahamut-e2e
```

### 2. 安裝相依套件

```bash
npm install
```

安裝完成後，`node_modules/` 目錄將包含以下核心套件：
- `selenium-webdriver` — 瀏覽器自動化驅動
- `mocha` 或 `jest` — 測試執行框架
- `chromedriver` — ChromeDriver 自動管理

---

## 執行方式

### 執行全部測試

```bash
npm test
```

### 執行單一頁面測試（範例）

```bash
npm test -- --grep "首頁"
```

### Headless 模式執行（CI/CD 環境）

```bash
HEADLESS=true npm test
```

> 預設以 Headless 模式執行，若需顯示瀏覽器畫面，請在 `.env` 或環境變數中設定 `HEADLESS=false`。

---

## 目錄結構說明

```
bahamut-e2e/
├── src/                          # 頁面物件模型（Page Objects）
│   ├── pages/
│   │   ├── HomePage.js           # 巴哈姆特首頁 POM
│   │   ├── ForumPage.js          # 討論板頁面 POM
│   │   ├── AnimeePage.js         # 動畫瘋頁面 POM
│   │   └── HalaPage.js           # 哈啦板頁面 POM
│   └── utils/
│       ├── driver.js             # WebDriver 初始化與設定
│       └── helpers.js            # 共用輔助函式
├── tests/                        # 測試腳本
│   ├── homePage.test.js          # 首頁測試案例
│   ├── forumPage.test.js         # 討論板測試案例
│   ├── animePage.test.js         # 動畫瘋測試案例
│   └── halaPage.test.js          # 哈啦板測試案例
├── docs/                         # 文件資料夾
│   └── TEST_SPEC.md              # 測試規格文件
├── package.json                  # 專案設定與相依套件
├── .env.example                  # 環境變數範本
└── README.md                     # 本說明文件
```

---

## 測試頁面與驗證項目清單

| # | 頁面名稱 | 測試 URL | 驗證項目 |
|---|----------|----------|----------|
| 1 | **首頁** | https://www.gamer.com.tw/ | 主導覽列（nav）存在、Logo 圖片元素存在 |
| 2 | **討論板** | https://forum.gamer.com.tw/ | 帖子列表容器載入、至少一筆帖子項目存在 |
| 3 | **動畫瘋** | https://ani.gamer.com.tw/ | 影片縮圖列表存在、至少一個影片項目可見 |
| 4 | **哈啦板** | https://forum.gamer.com.tw/B.php | 版塊列表容器存在、至少一個版塊項目存在 |

---

## 注意事項

### 網路依賴
- 所有測試均需連線至巴哈姆特線上伺服器，**請確保測試執行環境具備穩定的網際網路連線**。
- 若目標網站進行維護或改版，測試中使用的 XPath / CSS Selector 可能需要同步更新。
- 建議避免在網路尖峰時段或巴哈姆特公告維護期間執行測試。

### Headless 模式
- 預設採用 Chrome Headless 模式執行，不會彈出瀏覽器視窗，適合 CI/CD 環境。
- 若需除錯或觀察實際畫面，請設定 `HEADLESS=false` 以可視化模式執行。
- 部分頁面在 Headless 模式下可能因 User-Agent 差異而顯示不同內容，如遇此情況請改用非 Headless 模式確認。

### 反爬蟲機制
- 巴哈姆特可能啟用 Cloudflare 或其他反機器人機制，若測試過程中遭遇 Challenge 頁面，測試將失敗。
- 建議在 `driver.js` 中適當設定 User-Agent 與視窗大小，模擬正常使用者行為。
- 測試步驟之間應加入適當等待（Explicit Wait / WebDriverWait），避免過於快速的操作觸發限制。

### ChromeDriver 版本
- ChromeDriver 版本必須與本機 Chrome 瀏覽器版本完全對應，版本不符將導致 WebDriver 啟動失敗。
- 建議使用 `chromedriver` npm 套件自動管理版本，或定期更新 ChromeDriver。
