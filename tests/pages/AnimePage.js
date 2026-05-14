'use strict';

/**
 * AnimePage.js — 動畫瘋 Page Object
 * 封裝動畫瘋 https://ani.gamer.com.tw/ 的元素定位與驗證邏輯
 *
 * 動畫瘋特性（2026-05 驗證）：
 *  - 大量 AJAX / Vue.js 非同步載入
 *  - 影片卡片 class：anime-card-block
 *  - 容器 id：blockVideoInSeason、blockHotAnime
 *  - 分區標題：h1.theme-title、h3.day-title
 */

const { By, until } = require('selenium-webdriver');
const { BasePage, WAIT_TIMEOUT } = require('./BasePage');

/** 動畫瘋首頁 URL */
const ANIME_URL = 'https://ani.gamer.com.tw/';

class AnimePage extends BasePage {
  /**
   * @param {WebDriver} driver - 已初始化的 WebDriver 實體
   */
  constructor(driver) {
    super(driver);
  }

  /**
   * 導覽至動畫瘋首頁
   * @returns {Promise<void>}
   */
  async navigate() {
    await this.driver.get(ANIME_URL);
  }

  /**
   * 等待頁面達到穩定狀態（document.readyState === complete + body 存在）
   * @returns {Promise<void>}
   */
  async waitUntilLoaded() {
    await this.driver.wait(async () => {
      const state = await this.driver.executeScript('return document.readyState');
      return state === 'complete';
    }, WAIT_TIMEOUT, '等待 document.readyState === complete 超時');

    await this.driver.wait(
      until.elementLocated(By.css('body')),
      WAIT_TIMEOUT,
      '等待 <body> 元素存在超時'
    );
  }

  /**
   * 驗證頁面標題包含「動畫瘋」或「巴哈姆特」
   * @returns {Promise<boolean>}
   */
  async isTitleValid() {
    const title = await this.getTitle();
    return title.includes('動畫瘋') || title.includes('巴哈姆特');
  }

  /**
   * 驗證當前 URL 仍在動畫瘋網域（未被重新導向）
   * @returns {Promise<boolean>}
   */
  async isOnAnimePage() {
    const url = await this.getCurrentUrl();
    return url.includes('ani.gamer.com.tw');
  }

  /**
   * 取得影片列表容器元素
   *
   * 改用並行 fallback（Promise.all + 取第一個成功結果），
   * 避免舊版串行策略在全部失敗時累計 15+5+5+5=30s 等待。
   *
   * 最長等待時間固定為 WAIT_TIMEOUT（15s），而非累加。
   *
   * 策略（同時執行，取最快成功者）：
   *   1. #blockVideoInSeason 或 #blockHotAnime（最穩定的 id 錨點）
   *   2. .anime-card-block 卡片的父層容器
   *   3. .day-list / .newanime-block / .animate-theme-list
   *   4. 含 ≥3 個 animeVideo.php 連結的任意容器（最後防線）
   *
   * @returns {Promise<WebElement>}
   * @throws {Error} 所有策略均失敗時拋出
   */
  async getVideoListContainer() {
    const strategies = [
      // 策略 1：穩定 id 錨點
      this.driver.wait(
        until.elementLocated(
          By.xpath('//*[@id="blockVideoInSeason" or @id="blockHotAnime"]')
        ),
        WAIT_TIMEOUT
      ).catch(() => null),

      // 策略 2：anime-card-block 的父層容器
      this.driver.wait(
        until.elementLocated(By.xpath('//*[contains(@class,"anime-card-block")]')),
        WAIT_TIMEOUT
      ).then(async (card) => {
        try {
          return await card.findElement(
            By.xpath(
              'ancestor::div[contains(@class,"day-list") or ' +
              'contains(@class,"newanime-block") or ' +
              'contains(@class,"animate-theme-list")][1]'
            )
          );
        } catch (_) {
          return card; // 找不到父層就回傳卡片本身
        }
      }).catch(() => null),

      // 策略 3：列表容器 class
      this.driver.wait(
        until.elementLocated(
          By.xpath(
            '//*[contains(@class,"day-list") or ' +
            'contains(@class,"newanime-block") or ' +
            'contains(@class,"animate-theme-list")]'
          )
        ),
        WAIT_TIMEOUT
      ).catch(() => null),

      // 策略 4：URL 結構特徵（最終防線）
      this.driver.wait(
        until.elementLocated(
          By.xpath('//*[count(.//a[contains(@href,"animeVideo.php")]) >= 3]')
        ),
        WAIT_TIMEOUT
      ).catch(() => null),
    ];

    const results = await Promise.all(strategies);
    const found = results.find((r) => r !== null);

    if (!found) {
      throw new Error(
        '所有容器定位策略均失敗：找不到影片列表容器，請確認動畫瘋頁面結構是否有重大變更'
      );
    }
    return found;
  }

  /**
   * 驗證影片列表容器存在且可見
   * @returns {Promise<boolean>}
   */
  async isVideoListContainerDisplayed() {
    const container = await this.getVideoListContainer();
    return await container.isDisplayed();
  }

  /**
   * 取得影片縮圖與連結統計資訊
   * @returns {Promise<{imgCount: number, firstImgSrc: string, linkCount: number}>}
   */
  async getVideoItemInfo() {
    const container = await this.getVideoListContainer();

    // 等待至少一個縮圖出現
    await this.driver.wait(
      until.elementLocated(
        By.xpath(
          '//*[contains(@class,"anime-card-block") or ' +
          'contains(@href,"animeVideo.php")]//img[@src and string-length(@src) > 0]'
        )
      ),
      WAIT_TIMEOUT
    ).catch(() => { /* AJAX 仍在載入，後續用現有元素計數 */ });

    const imgs = await container.findElements(
      By.xpath('.//img[@src and string-length(@src) > 0]')
    );
    const imgCount = imgs.length;
    const firstImgSrc = imgCount > 0 ? await imgs[0].getAttribute('src') : '';

    const links = await container.findElements(
      By.xpath('.//a[contains(@href,"animeVideo.php")]')
    );

    return { imgCount, firstImgSrc, linkCount: links.length };
  }

  /**
   * 取得頁面分區標題資訊（本季新番、週播表等）
   * @returns {Promise<{found: boolean, count: number, firstText: string}>}
   */
  async getSectionHeaderInfo() {
    try {
      const headers = await this.driver.wait(
        until.elementsLocated(
          By.xpath(
            '//h1[string-length(normalize-space(text())) > 0] | ' +
            '//h2[string-length(normalize-space(text())) > 0] | ' +
            '//h3[string-length(normalize-space(text())) > 0] | ' +
            '//*[contains(@class,"theme-title") or contains(@class,"day-title") or ' +
            'contains(@class,"section-title") or contains(@class,"title-bar")]' +
            '[string-length(normalize-space(text())) > 0]'
          )
        ),
        WAIT_TIMEOUT
      );
      const count = headers.length;
      const firstText = count > 0 ? await headers[0].getText() : '';
      return { found: count > 0, count, firstText };
    } catch (_) {
      return { found: false, count: 0, firstText: '' };
    }
  }
}

module.exports = AnimePage;
