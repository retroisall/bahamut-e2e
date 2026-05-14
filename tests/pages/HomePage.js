'use strict';

/**
 * HomePage.js — 巴哈姆特首頁 Page Object
 * 封裝首頁 https://www.gamer.com.tw/ 的元素定位與驗證邏輯
 */

const { By, until } = require('selenium-webdriver');
const { BasePage, WAIT_TIMEOUT } = require('./BasePage');

/** 首頁 URL */
const HOME_URL = 'https://www.gamer.com.tw/';

class HomePage extends BasePage {
  /**
   * @param {WebDriver} driver - 已初始化的 WebDriver 實體
   */
  constructor(driver) {
    super(driver);
  }

  /**
   * 導覽至巴哈姆特首頁，等待 <body> 確認 DOM 已開始渲染
   * @returns {Promise<void>}
   */
  async navigate() {
    await this.driver.get(HOME_URL);
    await this.driver.wait(
      until.elementLocated(By.css('body')),
      WAIT_TIMEOUT
    );
  }

  /**
   * 驗證頁面標題屬於巴哈姆特正常頁面（含 Cloudflare Challenge 備援）
   * @returns {Promise<boolean>}
   */
  async isTitleValid() {
    const title = await this.getTitle();
    return title.includes('巴哈姆特') || title.includes('gamer.com.tw');
  }

  /**
   * 取得 Logo 元素（四層 fallback）
   * 1. #BH-top-data 內 class="logo" 的 <a>
   * 2. 任意 class 含 logo 的元素
   * 3. id 含 logo 的元素
   * 4. alt 含「巴哈姆特」的 <img>
   * @returns {Promise<WebElement>}
   */
  async getLogoElement() {
    try {
      return await this.driver.wait(
        until.elementLocated(
          By.xpath('//*[@id="BH-top-data"]//a[contains(@class,"logo")] | //a[@class="logo"]')
        ),
        WAIT_TIMEOUT
      );
    } catch (_) { /* 繼續策略 2 */ }

    try {
      return await this.driver.wait(
        until.elementLocated(By.xpath('//*[contains(@class,"logo")]')),
        WAIT_TIMEOUT
      );
    } catch (_) { /* 繼續策略 3 */ }

    try {
      return await this.driver.wait(
        until.elementLocated(By.xpath('//*[contains(@id,"logo")]')),
        WAIT_TIMEOUT
      );
    } catch (_) { /* 繼續策略 4 */ }

    return await this.driver.wait(
      until.elementLocated(By.xpath('//img[contains(@alt,"巴哈姆特")]')),
      WAIT_TIMEOUT
    );
  }

  /**
   * 驗證 Logo 元素存在且可見
   * @returns {Promise<boolean>}
   */
  async isLogoDisplayed() {
    const logo = await this.getLogoElement();
    return await logo.isDisplayed();
  }

  /**
   * 取得主導覽列元素（四層 fallback）
   * 1. #BH-menu-path（巴哈實際主選單容器）
   * 2. ul.BH-menuE（主選單清單）
   * 3. id 含 nav/menu 的元素
   * 4. class 含 nav/menu 的 ul/div
   * @returns {Promise<WebElement>}
   */
  async getNavElement() {
    try {
      return await this.driver.wait(
        until.elementLocated(By.xpath('//*[@id="BH-menu-path"]')),
        WAIT_TIMEOUT
      );
    } catch (_) { /* 繼續策略 2 */ }

    try {
      return await this.driver.wait(
        until.elementLocated(By.xpath('//ul[contains(@class,"BH-menuE")]')),
        WAIT_TIMEOUT
      );
    } catch (_) { /* 繼續策略 3 */ }

    try {
      return await this.driver.wait(
        until.elementLocated(By.xpath('//*[contains(@id,"nav") or contains(@id,"menu")]')),
        WAIT_TIMEOUT
      );
    } catch (_) { /* 繼續策略 4 */ }

    return await this.driver.wait(
      until.elementLocated(
        By.xpath(
          '//ul[contains(@class,"nav") or contains(@class,"menu")] | ' +
          '//div[contains(@class,"nav") or contains(@class,"menu")]'
        )
      ),
      WAIT_TIMEOUT
    );
  }

  /**
   * 驗證主導覽列元素存在且可見
   * @returns {Promise<boolean>}
   */
  async isNavDisplayed() {
    const nav = await this.getNavElement();
    return await nav.isDisplayed();
  }

  /**
   * 取得主導覽列內的連結數量
   * 優先計算 BH-menuE 的 <li> 項目（headless 模式下 JS 延遲渲染較準確）
   * @returns {Promise<number>}
   */
  async getNavLinkCount() {
    try {
      const items = await this.driver.findElements(
        By.xpath('//ul[contains(@class,"BH-menuE")]//li')
      );
      if (items.length > 0) return items.length;
    } catch (_) { /* fallback */ }

    const nav = await this.getNavElement();
    const links = await nav.findElements(By.css('a'));
    return links.length;
  }
}

module.exports = HomePage;
