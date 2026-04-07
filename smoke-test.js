import { chromium } from "playwright";

async function testSnakeMoves(page) {
  const before = await page.evaluate(() => window.getGameState());
  await page.keyboard.press("s");
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.getGameState());

  const passed = after.snake[0].y > before.snake[0].y;
  return { name: "snake moves down", passed };
}

async function testSnakeWraps(page) {
  await page.evaluate(() =>
    window.setGameState(
      [
        { x: 375, y: 175 },
        { x: 350, y: 175 },
        { x: 325, y: 175 },
      ],
      { x: 25, y: 25 },
      "d",
    ),
  );
  const before = await page.evaluate(() => window.getGameState());
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.getGameState());

  const passed = after.snake[0].x < before.snake[0].x;
  return { name: "snake wraps", passed };
}

async function testFoodEating(page) {
  await page.evaluate(() =>
    window.setGameState(
      [
        { x: 350, y: 175 },
        { x: 325, y: 175 },
        { x: 300, y: 175 },
      ],
      { x: 375, y: 175 },
      "d",
    ),
  );
  const before = await page.evaluate(() => window.getGameState());
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.getGameState());

  const passed = after.snake.length > before.snake.length;
  return { name: "snake eats", passed };
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(500);

  const results = [
    await testSnakeMoves(page),
    await testSnakeWraps(page),
    await testFoodEating(page),
  ];

  results.forEach((r) => {
    console.log(`${r.passed ? "PASS" : "FAIL"} — ${r.name}`);
  });

  await browser.close();
}

main();
