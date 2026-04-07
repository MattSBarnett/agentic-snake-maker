import { chromium } from "playwright";

async function testSnakeMoves(page) {
  const before = await page.evaluate(() => window.getGameState());
  await page.keyboard.press("s");
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.getGameState());

  const passed = after.snake[0].y > before.snake[0].y;
  return { name: "snake moves down", passed };
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(500);

  const results = [await testSnakeMoves(page)];

  results.forEach((r) => {
    console.log(`${r.passed ? "PASS" : "FAIL"} — ${r.name}`);
  });

  await browser.close();
}

main();
