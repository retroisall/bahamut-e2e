'use strict';

/**
 * HaraPage.js — 巴哈姆特哈啦板 Page Object（合併自 ForumPage + BahaPage）
 *
 * 目標頁面：https://forum.gamer.com.tw/B.php?bsn=1（VR快打 哈啦板）
 * TC-02 與 TC-04 共用此 Page Object，因為它們指向同一個 URL 並驗證相同的 DOM 結構。
 *
 * DOM 結構（2026-05 驗證）：
 *   <div class="b-list-wrap b-imglist-wrap b-imglist-wrap03">
 *     <table class="b-list">
 *       <tr class="b-list__row b-list-item b-imglist-item">
 *         <a class="b-list__main__title" href="C.php?bsn=...&snA=...">帖子標題</a>
 *       </tr>
 *     </table>
 *   </div>
 */

const { By, until } = require('selenium-webdriver');
const { BasePage, WAIT_TIMEOUT } = require('./BasePage');

/** 哈啦板 URL（bsn=1 為 VR快打板，確保有實際帖子內容） */
const HARA_URL = 'https://forum.gamer.com.tw/B.php?bsn=1';

/** 帖子列表動態載入的額外等待時間（毫秒） */
const LIST_WAIT_TIMEOUT = 10000;

class HaraPage extends BasePage {
  /**
   * @param {WebDriver} driver - 已初始化的 WebDriver 實體
   */
  constructor(driver) {
    super(driver);
  }

  /**
   * 導覽至哈啦板並等待 <body> 確認頁面已開始渲染
   * @returns {Promise<void>}
   */
  async navigate() {
    await this.driver.get(HARA_URL);
    await this.driver.wait(
      until.elementLocated(By.css('body')),
      WAIT_TIMEOUT
    );
  }

  /**
   * 驗證頁面標題包含「哈啦板」或「巴哈姆特」
   * 巴哈 B 頁標題格式：「{板名} 哈啦板 - 巴哈姆特」
   * @returns {Promise<boolean>}
   */
  async isTitleValid() {
    const title = await this.getTitle();
    return (
      title.includes('哈啦板') ||
      title.includes('討論板') ||
      title.includes('巴哈姆特') ||
      title.toLowerCase().includes('gamer')
    );
  }

  /**
   * 驗證當前 URL 仍在哈啦板頁面（未被重新導向）
   * @returns {Promise<{isValid: boolean, currentUrl: string}>}
   */
  async isOnHaraPage() {
    const currentUrl = await this.getCurrentUrl();
    return {
      isValid: currentUrl.includes('forum.gamer.com.tw/B.php'),
      currentUrl,
    };
  }

  /**
   * 等待並取得帖子列表容器元素
   * 定位策略（優先順序）：
   *   1. table.b-list（主要帖子列表表格）
   *   2. div.b-list-wrap（外層包裝容器）
   *   3. 含有 C.php 或 bsn= 連結的 table（DOM 變更備援）
   * @returns {Promise<WebElement>}
   */
  async getBoardListContainer() {
    try {
      return await this.driver.wait(
        until.elementLocated(By.css('table.b-list')),
        WAIT_TIMEOUT
      );
    } catch (_) { /* 繼續嘗試下一個策略 */ }

    try {
      return await this.driver.wait(
        until.elementLocated(By.css('div.b-list-wrap')),
        WAIT_TIMEOUT
      );
    } catch (_) { /* 繼續嘗試最終備援 */ }

    return await this.driver.wait(
      until.elementLocated(
        By.xpath('//table[.//a[contains(@href,"C.php") or contains(@href,"bsn=")]]')
      ),
      WAIT_TIMEOUT
    );
  }

  /**
   * 驗證帖子列表容器存在且可見
   * @returns {Promise<boolean>}
   */
  async isBoardListContainerDisplayed() {
    try {
      const container = await this.getBoardListContainer();
      return await container.isDisplayed();
    } catch (_) {
      return false;
    }
  }

  /**
   * 取得帖子數量
   * 計數策略：a.b-list__main__title → C.php 連結 → tr.b-list__row
   * @returns {Promise<number>}
   */
  async getBoardItemCount() {
    const container = await this.getBoardListContainer();

    try {
      await this.driver.wait(
        until.elementLocated(By.css('a.b-list__main__title')),
        LIST_WAIT_TIMEOUT
      );
    } catch (_) { /* 若超時則用備援計數 */ }

    const titleLinks = await container.findElements(By.css('a.b-list__main__title'));
    if (titleLinks.length > 0) return titleLinks.length;

    const postLinks = await container.findElements(
      By.xpath('.//a[contains(@href,"C.php")]')
    );
    if (postLinks.length > 0) return postLinks.length;

    const rows = await container.findElements(By.css('tr.b-list__row'));
    return rows.length;
  }
}

module.exports = HaraPage;
