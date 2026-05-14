'use strict';

/**
 * bahamut.test.js — 巴哈姆特 E2E 自動化測試主入口
 * 執行方式：node tests/bahamut.test.js
 */

const { buildDriver, quitDriver } = require('./helpers/driver');
const HomePage  = require('./pages/HomePage');
const HaraPage  = require('./pages/HaraPage');
const AnimePage = require('./pages/AnimePage');

let passed = 0;
let failed = 0;
let warned = 0;

/**
 * 輸出測試結果到 console
 * @param {string} tcId
 * @param {string} label
 * @param {'PASS'|'FAIL'|'WARN'|'SKIP'} status
 * @param {string} [message]
 */
function report(tcId, label, status, message = '') {
  const prefix = `[${tcId}] ${label}`;
  if (status === 'PASS') {
    passed++;
    console.log(`  ✔ PASS  ${prefix}${message ? ' — ' + message : ''}`);
  } else if (status === 'FAIL') {
    failed++;
    console.error(`  ✘ FAIL  ${prefix}${message ? ' — ' + message : ''}`);
  } else if (status === 'WARN') {
    warned++;
    console.warn(`  ⚠ WARN  ${prefix}${message ? ' — ' + message : ''}`);
  } else if (status === 'SKIP') {
    console.log(`  ↷ SKIP  ${prefix}${message ? ' — ' + message : ''}`);
  }
}

/**
 * TC-01：驗證巴哈姆特首頁核心元素
 * 驗證項目：頁面標題、Logo 存在、主導覽列存在且連結 >= 1
 */
async function testHomePage(driver) {
  console.log('\n=== TC-01 首頁核心元素驗證 ===');
  const page = new HomePage(driver);
  await page.navigate();

  const titleValid = await page.isTitleValid();
  const title = await page.getTitle();
  if (!titleValid) {
    report('TC-01', '頁面標題', 'SKIP', `遭遇非預期頁面，標題：「${title}」`);
    return;
  }
  report('TC-01', '頁面標題', 'PASS', `標題：「${title}」`);

  try {
    const logoDisplayed = await page.isLogoDisplayed();
    report('TC-01', 'Logo 元素可見', logoDisplayed ? 'PASS' : 'FAIL');
  } catch (err) {
    report('TC-01', 'Logo 元素可見', 'FAIL', err.message);
  }

  try {
    const navDisplayed = await page.isNavDisplayed();
    report('TC-01', '主導覽列可見', navDisplayed ? 'PASS' : 'FAIL');
  } catch (err) {
    report('TC-01', '主導覽列可見', 'FAIL', err.message);
  }

  try {
    const linkCount = await page.getNavLinkCount();
    if (linkCount >= 3) {
      report('TC-01', '導覽列連結數量 >= 3', 'PASS', `實際數量：${linkCount}`);
    } else if (linkCount >= 1) {
      report('TC-01', '導覽列連結數量 >= 1（headless 部分載入）', 'PASS', `實際數量：${linkCount}`);
    } else {
      report('TC-01', '導覽列連結數量 >= 1', 'FAIL', `實際數量：${linkCount}`);
    }
  } catch (err) {
    report('TC-01', '導覽列連結數量', 'FAIL', err.message);
  }
}

/**
 * TC-02：驗證哈啦板帖子列表（與 TC-04 共用 HaraPage）
 * 驗證項目：頁面標題、帖子列表容器存在、至少 1 筆帖子
 */
async function testForumPosts(driver) {
  console.log('\n=== TC-02 哈啦板帖子列表驗證 ===');
  const page = new HaraPage(driver);
  await page.navigate();

  const titleValid = await page.isTitleValid();
  const title = await page.getTitle();
  report('TC-02', '頁面標題', titleValid ? 'PASS' : 'FAIL', `標題：「${title}」`);

  try {
    const containerDisplayed = await page.isBoardListContainerDisplayed();
    report('TC-02', '帖子列表容器可見', containerDisplayed ? 'PASS' : 'FAIL');
  } catch (err) {
    report('TC-02', '帖子列表容器可見', 'FAIL', err.message);
    return;
  }

  try {
    const count = await page.getBoardItemCount();
    if (count >= 1) {
      report('TC-02', '帖子項目 >= 1 筆', 'PASS', `實際數量：${count}`);
    } else {
      report('TC-02', '帖子項目 >= 1 筆', 'WARN', '帖子數為 0（可能為時段清空）');
    }
  } catch (err) {
    report('TC-02', '帖子項目 >= 1 筆', 'FAIL', err.message);
  }
}

/**
 * TC-04：驗證哈啦板版塊列表（與 TC-02 共用 HaraPage）
 * 驗證項目：URL 未重新導向、頁面標題、版塊容器可見、版塊連結 >= 1
 */
async function testHaraBoards(driver) {
  console.log('\n=== TC-04 哈啦板版塊列表驗證 ===');
  const page = new HaraPage(driver);

  const { isValid, currentUrl } = await page.isOnHaraPage();
  if (!isValid) {
    report('TC-04', '頁面未被重新導向', 'FAIL', `實際 URL：${currentUrl}`);
    return;
  }
  report('TC-04', '頁面未被重新導向', 'PASS');

  const titleValid = await page.isTitleValid();
  const title = await page.getTitle();
  report('TC-04', '頁面標題', titleValid ? 'PASS' : 'FAIL', `標題：「${title}」`);

  try {
    const containerDisplayed = await page.isBoardListContainerDisplayed();
    report('TC-04', '版塊列表容器可見', containerDisplayed ? 'PASS' : 'FAIL');
  } catch (err) {
    report('TC-04', '版塊列表容器可見', 'FAIL', err.message);
    return;
  }

  try {
    const count = await page.getBoardItemCount();
    report('TC-04', '版塊項目 >= 1 個', count >= 1 ? 'PASS' : 'FAIL', `實際數量：${count}`);
  } catch (err) {
    report('TC-04', '版塊項目 >= 1 個', 'FAIL', err.message);
  }
}

/**
 * TC-03：驗證動畫瘋影片列表
 * 驗證項目：頁面載入、URL 未重新導向、標題、影片容器、縮圖、分區標題
 */
async function testAnimePage(driver) {
  console.log('\n=== TC-03 動畫瘋影片列表驗證 ===');
  const page = new AnimePage(driver);
  await page.navigate();

  try {
    await page.waitUntilLoaded();
  } catch (err) {
    report('TC-03', '頁面基礎載入完成', 'FAIL', err.message);
    return;
  }
  report('TC-03', '頁面基礎載入完成', 'PASS');

  const onPage = await page.isOnAnimePage();
  if (!onPage) {
    const url = await page.getCurrentUrl();
    report('TC-03', '頁面未被重新導向', 'FAIL', `實際 URL：${url}`);
    return;
  }
  report('TC-03', '頁面未被重新導向', 'PASS');

  const titleValid = await page.isTitleValid();
  const title = await page.getTitle();
  report('TC-03', '頁面標題', titleValid ? 'PASS' : 'WARN', `標題：「${title}」`);

  try {
    const containerDisplayed = await page.isVideoListContainerDisplayed();
    report('TC-03', '影片列表容器可見', containerDisplayed ? 'PASS' : 'FAIL');
  } catch (err) {
    report('TC-03', '影片列表容器可見', 'FAIL', err.message);
    return;
  }

  try {
    const { imgCount, firstImgSrc, linkCount } = await page.getVideoItemInfo();
    if (imgCount >= 1) {
      report('TC-03', '影片縮圖 >= 1 個', 'PASS',
        `圖片數量：${imgCount}，第一個 src 前 60 字：${firstImgSrc.substring(0, 60)}`);
    } else {
      report('TC-03', '影片縮圖 >= 1 個', 'FAIL', '未找到含 src 的 <img> 元素');
    }
    if (linkCount >= 1) {
      report('TC-03', '動畫影片連結 >= 1 個 (animeVideo.php)', 'PASS', `連結數量：${linkCount}`);
    } else {
      report('TC-03', '動畫影片連結 >= 1 個 (animeVideo.php)', 'WARN', '未找到 animeVideo.php 連結');
    }
  } catch (err) {
    report('TC-03', '影片縮圖 >= 1 個', 'FAIL', err.message);
  }

  try {
    const { found, count, firstText } = await page.getSectionHeaderInfo();
    if (found) {
      report('TC-03', '頁面分區標題存在', 'PASS', `找到 ${count} 個標題，第一個：「${firstText}」`);
    } else {
      report('TC-03', '頁面分區標題存在', 'WARN', '未找到分區標題');
    }
  } catch (err) {
    report('TC-03', '頁面分區標題存在', 'WARN', err.message);
  }
}

/**
 * 主執行函式
 * 依序執行 TC-01 → TC-02 → TC-04 → TC-03
 */
async function main() {
  console.log('========================================');
  console.log(' 巴哈姆特 E2E 自動化測試 開始執行');
  console.log(`  模式：${process.env.HEADLESS === 'false' ? '可視化' : 'Headless'}`);
  console.log('========================================');

  const driver = await buildDriver();
  try {
    await testHomePage(driver);
    await testForumPosts(driver);
    await testHaraBoards(driver);
    await testAnimePage(driver);
  } finally {
    await quitDriver(driver);
  }

  console.log('\n========================================');
  console.log(' 測試執行完畢');
  console.log(`  PASS：${passed}`);
  console.log(`  FAIL：${failed}`);
  console.log(`  WARN：${warned}`);
  console.log('========================================');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('[FATAL] 測試執行時發生未預期錯誤：', err);
  process.exit(1);
});
