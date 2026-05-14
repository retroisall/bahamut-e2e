'use strict';

/**
 * HomePage 單元測試
 * 使用 mock driver，不需要開啟瀏覽器或連線到真實網站
 * 測試 isTitleValid() 的判斷邏輯是否正確
 */

const HomePage = require('../pages/HomePage');

/** 建立最小化的 mock driver */
function createMockDriver(title = '巴哈姆特電玩資訊站') {
  return {
    get: jest.fn().mockResolvedValue(undefined),
    getTitle: jest.fn().mockResolvedValue(title),
    getCurrentUrl: jest.fn().mockResolvedValue('https://www.gamer.com.tw/'),
    wait: jest.fn().mockResolvedValue({ isDisplayed: jest.fn().mockResolvedValue(true) }),
    findElements: jest.fn().mockResolvedValue([{}, {}, {}]),
  };
}

describe('HomePage.isTitleValid()', () => {
  it('標題包含「巴哈姆特」時應回傳 true', async () => {
    const driver = createMockDriver('巴哈姆特電玩資訊站');
    const page = new HomePage(driver);
    expect(await page.isTitleValid()).toBe(true);
  });

  it('標題包含「gamer.com.tw」時應回傳 true（備援條件）', async () => {
    const driver = createMockDriver('gamer.com.tw 測試頁面');
    const page = new HomePage(driver);
    expect(await page.isTitleValid()).toBe(true);
  });

  it('Cloudflare Challenge 頁面應回傳 false', async () => {
    const driver = createMockDriver('Just a moment...');
    const page = new HomePage(driver);
    expect(await page.isTitleValid()).toBe(false);
  });

  it('空白標題應回傳 false', async () => {
    const driver = createMockDriver('');
    const page = new HomePage(driver);
    expect(await page.isTitleValid()).toBe(false);
  });

  it('其他不相關網站應回傳 false', async () => {
    const driver = createMockDriver('Google');
    const page = new HomePage(driver);
    expect(await page.isTitleValid()).toBe(false);
  });
});

describe('HomePage.getTitle()', () => {
  it('應回傳 driver.getTitle() 的值', async () => {
    const driver = createMockDriver('測試標題');
    const page = new HomePage(driver);
    expect(await page.getTitle()).toBe('測試標題');
    expect(driver.getTitle).toHaveBeenCalledTimes(1);
  });
});
