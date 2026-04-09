import "dotenv/config";
import { readFileSync } from "fs";

export async function analyzeScreenshot(
  beforeScreenShot,
  afterScreenShot,
  question,
) {
  const beforeBase64 = base64Image(beforeScreenShot);
  const afterBase64 = base64Image(afterScreenShot);

  const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen2.5vl:7b",
      messages: [
        {
          role: "user",
          content: question,
          images: [beforeBase64, afterBase64],
        },
      ],
      stream: false,
    }),
  });

  const data = await response.json();
  return data.message.content;
}

function base64Image(imageLocation) {
  const imageData = readFileSync(imageLocation);
  return imageData.toString("base64");
}
