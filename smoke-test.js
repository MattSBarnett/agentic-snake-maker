import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { analyzeScreenshot } from "./llm.js";

async function testSnakeMoves(page) {
  const beforeFile = "screenshots/snake-moves-before.png";
  const afterFile = "screenshots/snake-moves-after.png";
  const before = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: beforeFile });
  await page.keyboard.press("s");
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: afterFile });

  const passed = after.snake[0].y > before.snake[0].y;

  const vision = await analyzeScreenshot(
    beforeFile,
    afterFile,
    `These are two screenshots of a Snake game taken before and after pressing the down key. 
    In the first image the snake is a horizontal green rectangle. 
    In the second image has the snake's orientation changed to vertical?`,
  );

  return {
    name: "snake moves down",
    passed,
    vision,
    screenshot: [beforeFile, afterFile],
  };
}

async function testSnakeWraps(page) {
  const beforeFile = "screenshots/snake-wraps-before.png";
  const afterFile = "screenshots/snake-wraps-after.png";
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
  await page.screenshot({ path: beforeFile });
  await page.waitForTimeout(450);
  const after = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: afterFile });

  const passed = after.snake[0].x < before.snake[0].x;

  const vision = await analyzeScreenshot(
    beforeFile,
    afterFile,
    `These are two screenshots of a Snake game taken as the game starts then waiting for the snake to move. 
    In the first image the snake is in the middle of the screen. 
    In the second image has the snake wrapped from the left of the screen to the right?`,
  );

  return {
    name: "snake wraps",
    passed,
    vision,
    screenshot: [beforeFile, afterFile],
  };
}

async function testFoodEating(page) {
  const beforeFile = "screenshots/food-eating-before.png";
  const afterFile = "screenshots/food-eating-after.png";
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
  await page.screenshot({ path: beforeFile });
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: afterFile });

  const passed = after.snake.length > before.snake.length;

  const vision = await analyzeScreenshot(
    beforeFile,
    afterFile,
    `These are two screenshots of a Snake game taken as the game starts with some food which is a red square.
    In the first image the snake is heading for some food. 
    In the second image the snake has eaten the food and the food has moved, the snake has gotten larger?`,
  );

  return {
    name: "snake eats",
    passed,
    vision,
    screenshot: [beforeFile, afterFile],
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
    console.log(`  vision: ${r.vision}`);
    console.log(`  screenshots: ${r.screenshot.join(", ")}`);
  });

  await browser.close();
}

main();
