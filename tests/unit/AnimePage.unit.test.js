'use strict';

/**
 * AnimePage 單元測試
 * 重點測試 getVideoListContainer() 的並行 fallback 邏輯
 * — 這是改寫後最重要的邏輯，E2E 測試永遠只走「策略1成功」的路徑
 */

const AnimePage = require('../pages/AnimePage');

function createMockElement(overrides = {}) {
  return {
    isDisplayed: jest.fn().mockResolvedValue(true),
    findElements: jest.fn().mockResolvedValue([]),
    findElement: jest.fn(),
    getAttribute: jest.fn().mockResolvedValue('https://example.com/img.jpg'),
    getText: jest.fn().mockResolvedValue('本季新番'),
    ...overrides,
  };
}

describe('AnimePage.isTitleValid()', () => {
  it('標題含「動畫瘋」應回傳 true', async () => {
    const driver = { getTitle: jest.fn().mockResolvedValue('動畫瘋 - 線上看動漫') };
    const page = new AnimePage(driver);
    expect(await page.isTitleValid()).toBe(true);
  });

  it('標題含「巴哈姆特」應回傳 true', async () => {
    const driver = { getTitle: jest.fn().mockResolvedValue('巴哈姆特 動畫') };
    const page = new AnimePage(driver);
    expect(await page.isTitleValid()).toBe(true);
  });

  it('不相關標題應回傳 false', async () => {
    const driver = { getTitle: jest.fn().mockResolvedValue('Netflix') };
    const page = new AnimePage(driver);
    expect(await page.isTitleValid()).toBe(false);
  });
});

describe('AnimePage.isOnAnimePage()', () => {
  it('URL 包含 ani.gamer.com.tw 應回傳 true', async () => {
    const driver = {
      getCurrentUrl: jest.fn().mockResolvedValue('https://ani.gamer.com.tw/'),
    };
    const page = new AnimePage(driver);
    expect(await page.isOnAnimePage()).toBe(true);
  });

  it('被重新導向時應回傳 false', async () => {
    const driver = {
      getCurrentUrl: jest.fn().mockResolvedValue('https://www.gamer.com.tw/login.php'),
    };
    const page = new AnimePage(driver);
    expect(await page.isOnAnimePage()).toBe(false);
  });
});

describe('AnimePage.getVideoListContainer() — 並行 fallback 邏輯', () => {
  it('策略 1 成功時應直接回傳，其他策略結果被忽略', async () => {
    const strategy1Element = createMockElement();
    const driver = {
      // 第一個 wait 成功（策略 1），後面都失敗
      wait: jest.fn()
        .mockResolvedValueOnce(strategy1Element)  // 策略 1 成功
        .mockRejectedValue(new Error('找不到元素')),
    };
    const page = new AnimePage(driver);
    const result = await page.getVideoListContainer();
    expect(result).toBe(strategy1Element);
  });

  it('策略 1 失敗時應 fallback 到策略 2', async () => {
    const strategy2Card = createMockElement({
      findElement: jest.fn().mockRejectedValue(new Error('無父層')),
    });
    const driver = {
      wait: jest.fn()
        .mockRejectedValueOnce(new Error('策略1失敗'))  // 策略 1 失敗
        .mockResolvedValueOnce(strategy2Card)             // 策略 2 成功（找到卡片）
        .mockRejectedValue(new Error('策略3/4失敗')),
    };
    const page = new AnimePage(driver);
    const result = await page.getVideoListContainer();
    // 策略 2 找到卡片但找不到父層，應回傳卡片本身
    expect(result).toBe(strategy2Card);
  });

  it('策略 1、2 失敗時應 fallback 到策略 3', async () => {
    const strategy3Element = createMockElement();
    const driver = {
      wait: jest.fn()
        .mockRejectedValueOnce(new Error('策略1失敗'))
        .mockRejectedValueOnce(new Error('策略2失敗'))
        .mockResolvedValueOnce(strategy3Element)  // 策略 3 成功
        .mockRejectedValue(new Error('策略4失敗')),
    };
    const page = new AnimePage(driver);
    const result = await page.getVideoListContainer();
    expect(result).toBe(strategy3Element);
  });

  it('所有策略均失敗時應拋出錯誤', async () => {
    const driver = {
      wait: jest.fn().mockRejectedValue(new Error('找不到元素')),
    };
    const page = new AnimePage(driver);
    await expect(page.getVideoListContainer()).rejects.toThrow(
      '所有容器定位策略均失敗'
    );
  });

  it('多個策略同時成功時，應回傳第一個非 null 的結果', async () => {
    const el1 = createMockElement();
    const el2 = createMockElement();
    // 策略 1 和策略 3 都成功，策略 2/4 失敗（模擬並行結果）
    const driver = {
      wait: jest.fn()
        .mockResolvedValueOnce(el1)              // 策略 1 成功
        .mockRejectedValueOnce(new Error())      // 策略 2 失敗
        .mockResolvedValueOnce(el2)              // 策略 3 成功
        .mockRejectedValueOnce(new Error()),     // 策略 4 失敗（必須定義，否則回傳 undefined）
    };
    const page = new AnimePage(driver);
    const result = await page.getVideoListContainer();
    // Promise.all 後取第一個非 null：el1（策略 1）
    expect(result).toBe(el1);
  });
});
