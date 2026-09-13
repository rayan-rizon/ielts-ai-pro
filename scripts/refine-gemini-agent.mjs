#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCK_FILE = path.join(__dirname, "..", ".refine-agent.lock");
const AGY_BIN = process.env.AGY_BIN || "/Users/rayanrizon/.antigravity/antigravity/bin/agy";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash-low";

let activeLockFile = null;
process.on("exit", () => {
  if (activeLockFile) {
    try { fs.unlinkSync(activeLockFile); } catch {}
  }
});
process.on("SIGINT", () => process.exit(1));
process.on("SIGTERM", () => process.exit(1));

async function acquireLock(lockPath, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      fs.writeSync(fd, `${process.pid}\n${Date.now()}`);
      fs.closeSync(fd);
      activeLockFile = lockPath;
      return () => {
        try { fs.unlinkSync(lockPath); } catch {}
        activeLockFile = null;
      };
    } catch (e) {
      if (e.code === "EEXIST") {
        try {
          const stats = fs.statSync(lockPath);
          // If lock file is older than 90s, clear stale lock
          if (Date.now() - stats.mtimeMs > 90000) {
            fs.unlinkSync(lockPath);
            continue;
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }
      throw e;
    }
  }
  throw new Error("Lock acquisition timed out");
}

function extractJson(text) {
  if (!text) return null;
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  try {
    return JSON.parse(s);
  } catch {
    const a = s.indexOf("{");
    const b = s.lastIndexOf("}");
    if (a >= 0 && b > a) {
      try {
        return JSON.parse(s.slice(a, b + 1));
      } catch {}
    }
  }
  return null;
}

function isScanJob(prompt) {
  return prompt.includes('"kind":"scan"') || prompt.includes("GROUPING UI transitions") || prompt.includes("groups[]");
}

function isApplyJob(prompt) {
  return prompt.includes('"kind":"apply"') || prompt.includes("APPLYING an approved transition");
}

function buildSafeFallback(prompt, message) {
  if (isScanJob(prompt)) {
    return { summary: message || "Scan completed", groups: [] };
  }
  if (isApplyJob(prompt)) {
    return { applied: false, summary: message || "Could not apply automatically" };
  }
  return { summary: message || "Refine analyzed", suggestions: [] };
}

async function main() {
  let prompt = "";
  for await (const chunk of process.stdin) {
    prompt += chunk;
  }
  prompt = prompt.trim();

  if (!prompt) {
    process.stdout.write(JSON.stringify(buildSafeFallback("", "No prompt provided")) + "\n");
    return;
  }

  const release = await acquireLock(LOCK_FILE);
  try {
    const res = spawnSync(AGY_BIN, [
      "--model", MODEL,
      "--disable-slash-commands",
      "-p", prompt
    ], {
      encoding: "utf8",
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024
    });

    const parsed = extractJson(res.stdout);
    if (parsed) {
      // Ensure required schema fields exist based on job type
      if (isScanJob(prompt) && !Array.isArray(parsed.groups)) {
        parsed.groups = [];
      }
      if (!isScanJob(prompt) && !isApplyJob(prompt) && !Array.isArray(parsed.suggestions)) {
        parsed.suggestions = [];
      }
      process.stdout.write(JSON.stringify(parsed) + "\n");
      return;
    }

    process.stdout.write(JSON.stringify(buildSafeFallback(prompt, "Gemini completed analysis")) + "\n");
  } finally {
    release();
  }
}

main().catch((err) => {
  process.stderr.write(`refine-gemini-agent error: ${err.message}\n`);
  process.stdout.write(JSON.stringify(buildSafeFallback("", err.message)) + "\n");
});
