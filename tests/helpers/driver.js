'use strict';

/**
 * driver.js — WebDriver 初始化與清理模組
 * 負責建立 headless Chrome WebDriver 並設定基本 timeout
 */

const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/**
 * 建立 Chrome WebDriver 實體
 * - headless 模式由環境變數 HEADLESS=false 控制
 * - 視窗尺寸設為 1920x1080 模擬桌面使用者
 * - pageLoad timeout 為 30 秒
 * - User-Agent 交由 Selenium Manager 自動管理（不手動指定，避免版本過期）
 * @returns {Promise<WebDriver>}
 */
async function buildDriver() {
  const options = new chrome.Options();

  if (process.env.HEADLESS !== 'false') {
    options.addArguments('--headless=new');
  }

  options.addArguments('--window-size=1920,1080');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({ pageLoad: 30000 });
  return driver;
}

/**
 * 安全地關閉 WebDriver，釋放瀏覽器資源
 * 應在 finally 區塊呼叫，確保無論測試成功或失敗都能正確關閉
 * @param {WebDriver} driver
 * @returns {Promise<void>}
 */
async function quitDriver(driver) {
  if (driver) {
    try {
      await driver.quit();
    } catch (err) {
      console.warn('[driver] driver.quit() 發生錯誤（已忽略）：', err.message);
    }
  }
}

module.exports = { buildDriver, quitDriver };
