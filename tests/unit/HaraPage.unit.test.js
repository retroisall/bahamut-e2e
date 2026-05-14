'use strict';

/**
 * HaraPage 單元測試
 * 測試 isTitleValid()、isOnHaraPage()、getBoardItemCount() 的邏輯
 */

const HaraPage = require('../pages/HaraPage');

function createMockDriver({ title = 'VR快打 哈啦板 - 巴哈姆特', url = 'https://forum.gamer.com.tw/B.php?bsn=1' } = {}) {
  const mockElement = {
    isDisplayed: jest.fn().mockResolvedValue(true),
    findElements: jest.fn().mockResolvedValue(
      // 模擬 10 筆帖子標題連結
      Array(10).fill({ getAttribute: jest.fn() })
    ),
  };
  return {
    get: jest.fn().mockResolvedValue(undefined),
    getTitle: jest.fn().mockResolvedValue(title),
    getCurrentUrl: jest.fn().mockResolvedValue(url),
    wait: jest.fn().mockResolvedValue(mockElement),
    findElements: jest.fn().mockResolvedValue([]),
  };
}

describe('HaraPage.isTitleValid()', () => {
  it('標題包含「哈啦板」應回傳 true', async () => {
    const page = new HaraPage(createMockDriver({ title: 'VR快打 哈啦板 - 巴哈姆特' }));
    expect(await page.isTitleValid()).toBe(true);
  });

  it('標題包含「巴哈姆特」應回傳 true', async () => {
    const page = new HaraPage(createMockDriver({ title: '巴哈姆特電玩資訊站' }));
    expect(await page.isTitleValid()).toBe(true);
  });

  it('標題包含「討論板」應回傳 true', async () => {
    const page = new HaraPage(createMockDriver({ title: '某討論板 - 巴哈姆特' }));
    expect(await page.isTitleValid()).toBe(true);
  });

  it('標題包含「gamer」（小寫）應回傳 true', async () => {
    const page = new HaraPage(createMockDriver({ title: 'gamer community' }));
    expect(await page.isTitleValid()).toBe(true);
  });

  it('不相關標題應回傳 false', async () => {
    const page = new HaraPage(createMockDriver({ title: 'Error Page' }));
    expect(await page.isTitleValid()).toBe(false);
  });
});

describe('HaraPage.isOnHaraPage()', () => {
  it('URL 包含 forum.gamer.com.tw/B.php 應回傳 isValid: true', async () => {
    const page = new HaraPage(createMockDriver());
    const result = await page.isOnHaraPage();
    expect(result.isValid).toBe(true);
    expect(result.currentUrl).toContain('forum.gamer.com.tw/B.php');
  });

  it('被導向登入頁時應回傳 isValid: false', async () => {
    const page = new HaraPage(createMockDriver({
      url: 'https://www.gamer.com.tw/login.php',
    }));
    const result = await page.isOnHaraPage();
    expect(result.isValid).toBe(false);
    expect(result.currentUrl).toContain('login.php');
  });
});

describe('HaraPage.getBoardItemCount()', () => {
  it('找到帖子標題連結時應回傳正確數量', async () => {
    const mockLinks = Array(15).fill({});
    const mockContainer = {
      findElements: jest.fn().mockResolvedValue(mockLinks),
    };
    const driver = createMockDriver();
    driver.wait = jest.fn().mockResolvedValue(mockContainer);

    const page = new HaraPage(driver);
    const count = await page.getBoardItemCount();
    expect(count).toBe(15);
  });

  it('無標題連結時應 fallback 到 C.php 連結計數', async () => {
    const mockContainer = {
      // 第一次呼叫（b-list__main__title）回傳空陣列
      // 第二次呼叫（C.php）回傳 5 筆
      findElements: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(Array(5).fill({}))
        .mockResolvedValue([]),
    };
    const driver = createMockDriver();
    driver.wait = jest.fn().mockResolvedValue(mockContainer);

    const page = new HaraPage(driver);
    const count = await page.getBoardItemCount();
    expect(count).toBe(5);
  });
});
