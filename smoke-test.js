import { chromium } from "playwright";
import { mkdirSync } from "fs";

async function testSnakeMoves(page) {
  const before = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: "screenshots/snake-moves-before.png" });
  await page.keyboard.press("s");
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: "screenshots/snake-moves-after.png" });

  const passed = after.snake[0].y > before.snake[0].y;
  return {
    name: "snake moves down",
    passed,
    screenshot: [
      "screenshots/snake-moves-before.png",
      "screenshots/snake-moves-after.png",
    ],
  };
}

async function testSnakeWraps(page) {
  await page.evaluate(() =>
    window.setGameState(
      [
        { x: 350, y: 175 },
        { x: 325, y: 175 },
        { x: 300, y: 175 },
      ],
      { x: 25, y: 25 },
      "d",
    ),
  );
  const before = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: "screenshots/snake-wraps-before.png" });
  await page.waitForTimeout(450);
  const after = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: "screenshots/snake-wraps-after.png" });

  const passed = after.snake[0].x < before.snake[0].x;
  return {
    name: "snake wraps",
    passed,
    screenshot: [
      "screenshots/snake-wraps-before.png",
      "screenshots/snake-wraps-after.png",
    ],
  };
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
  await page.screenshot({ path: "screenshots/food-eating-before.png" });
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: "screenshots/food-eating-after.png" });

  const passed = after.snake.length > before.snake.length;
  return {
    name: "snake eats",
    passed,
    screenshot: [
      "screenshots/food-eating-before.png",
      "screenshots/food-eating-after.png",
    ],
  };
}

async function main() {
  mkdirSync("screenshots", { recursive: true });
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
    console.log(`  screenshots: ${r.screenshot.join(", ")}`);
  });

  await browser.close();
}

main();
