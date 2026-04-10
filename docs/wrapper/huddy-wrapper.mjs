#!/usr/bin/env node
/**
 * huddy + OMC HUD 통합 래퍼
 * stdin JSON을 양쪽에 전달하고, 출력을 합침:
 *   1) huddy 버디 캐릭터 (+ 선택적 HUD)
 *   2) 기존 statusline (omc-hud 등)
 *
 * huddy가 없어도 기존 statusline은 정상 동작 (비침습적)
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    if (process.stdin.isTTY) resolve("");
  });
}

async function main() {
  const stdinData = await readStdin();
  const outputs = [];

  // 1) huddy 버디 캐릭터 — 없으면 건너뜀 (비침습적)
  try {
    const huddyResult = execFileSync("huddy", [], {
      input: stdinData,
      encoding: "utf8",
      timeout: 200, // 200ms 제한
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    if (huddyResult) {
      outputs.push(huddyResult);
    }
  } catch {
    // huddy가 설치 안 됐거나 에러 → 조용히 무시
  }

  // 2) 기존 statusline (omc-hud) — 없으면 건너뜀
  const configDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
  const omcHudPath = join(configDir, "hud", "omc-hud.mjs");

  if (existsSync(omcHudPath)) {
    try {
      const omcResult = execFileSync("node", [omcHudPath], {
        input: stdinData,
        encoding: "utf8",
        timeout: 250,
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();

      if (omcResult) {
        outputs.push(omcResult);
      }
    } catch {
      // omc-hud 에러 → 조용히 무시
    }
  }

  // 합쳐서 출력
  if (outputs.length > 0) {
    console.log(outputs.join("\n"));
  }
}

main();
