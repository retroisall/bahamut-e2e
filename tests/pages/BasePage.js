'use strict';

/** 所有 Page Object 的基底類別，封裝共用的 driver 操作與常數 */

/** 等待元素出現的最長時間（毫秒） */
const WAIT_TIMEOUT = 15000;

class BasePage {
  /**
   * @param {WebDriver} driver - 已初始化的 WebDriver 實體
   */
  constructor(driver) {
    this.driver = driver;
    this.WAIT_TIMEOUT = WAIT_TIMEOUT;
  }

  /**
   * 取得頁面標題文字
   * @returns {Promise<string>}
   */
  async getTitle() {
    return await this.driver.getTitle();
  }

  /**
   * 取得目前頁面的 URL
   * @returns {Promise<string>}
   */
  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }
}

module.exports = { BasePage, WAIT_TIMEOUT };
