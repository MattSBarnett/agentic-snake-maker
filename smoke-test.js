import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { analyzeScreenshot } from "./llm.js";

const AGENT_MODE = process.env.AGENT_MODE === "true";

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

  const vision = AGENT_MODE
    ? "vision skipped in agent mode"
    : await analyzeScreenshot(
        beforeFile,
        afterFile,
        "These are two screenshots of a Snake game. Has the snake moved downward between the first and second image?",
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

  const vision = AGENT_MODE
    ? "vision skipped in agent mode"
    : await analyzeScreenshot(
        beforeFile,
        afterFile,
        "These are two screenshots of a Snake game. Has the snake wrapped from one side of the screen to the other?",
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

  const vision = AGENT_MODE
    ? "vision skipped in agent mode"
    : await analyzeScreenshot(
        beforeFile,
        afterFile,
        "These are two screenshots of a Snake game. Has the snake eaten the food and grown longer?",
      );

  return {
    name: "snake eats",
    passed,
    vision,
    screenshot: [beforeFile, afterFile],
  };
}

async function testScoreIncrements(page) {
  const beforeFile = "screenshots/score-increments-before.png";
  const afterFile = "screenshots/score-increments-after.png";
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
  await page.keyboard.press("d");
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: afterFile });

  const passed = after.score === before.score + 1;

  const vision = AGENT_MODE
    ? "vision skipped in agent mode"
    : await analyzeScreenshot(
        beforeFile,
        afterFile,
        "These are two screenshots of a Snake game. Is the score displayed and incremented in the second image?",
      );

  return {
    name: "score increments",
    passed,
    vision,
    screenshot: [beforeFile, afterFile],
  };
}

async function testGameOverMessage(page) {
  const beforeFile = "screenshots/game-over-before.png";
  const afterFile = "screenshots/game-over-after.png";
  await page.evaluate(() =>
    window.setGameState(
      [
        { x: 300, y: 175 },
        { x: 325, y: 175 },
        { x: 300, y: 200 },
      ],
      { x: 350, y: 175 },
      "d",
    ),
  );
  const before = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: beforeFile });
  await page.keyboard.press("d");
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: afterFile });

  const passed = after.gameOver;

  const vision = AGENT_MODE
    ? "vision skipped in agent mode"
    : await analyzeScreenshot(
        beforeFile,
        afterFile,
        "These are two screenshots of a Snake game. Is the 'Game Over' message visible in the second image?",
      );

  return {
    name: "game over message",
    passed,
    vision,
    screenshot: [beforeFile, afterFile],
  };
}

async function testSpeedBoost(page) {
  const beforeFile = "screenshots/speed-boost-before.png";
  const afterFile = "screenshots/speed-boost-after.png";
  await page.evaluate(() =>
    window.setGameState(
      [
        { x: 350, y: 175 },
        { x: 325, y: 175 },
        { x: 300, y: 175 },
      ],
      { x: 350, y: 175 },
      "d",
      null,
      true
    ),
  );
  const before = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: beforeFile });
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.getGameState());
  await page.screenshot({ path: afterFile });

  const passed = after.speedBoostActive;

  const vision = AGENT_MODE
    ? "vision skipped in agent mode"
    : await analyzeScreenshot(
        beforeFile,
        afterFile,
        "These are two screenshots of a Snake game. Has the snake collided with the speed boost, causing the game speed to double?",
      );

  return {
    name: "speed boost",
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
    await testScoreIncrements(page),
    await testGameOverMessage(page),
    await testSpeedBoost(page),
  ];

  results.forEach((r) => {
    console.log(`${r.passed ? "PASS" : "FAIL"} — ${r.name}`);
    console.log(`  vision: ${r.vision}`);
    console.log(`  screenshots: ${r.screenshot.join(", ")}`);
  });

  await browser.close();
}

main();