/**
 * Early-access waitlist — durable store, no fake client-only join.
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { MeterLiveError } from "./env";

export type WaitlistEntry = {
  email: string;
  createdAt: string;
  source: string;
  userAgent?: string;
};

type WaitlistFile = {
  version: 1;
  updatedAt: string;
  entries: WaitlistEntry[];
};

const FILE = path.resolve(process.cwd(), "data/waitlist.json");

let lock: Promise<void> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
}

async function readAll(): Promise<WaitlistFile> {
  try {
    const raw = await readFile(FILE, "utf8");
    return JSON.parse(raw) as WaitlistFile;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, updatedAt: new Date().toISOString(), entries: [] };
    }
    throw err;
  }
}

async function writeAll(data: WaitlistFile): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${Date.now()}.tmp`;
  const next = { ...data, updatedAt: new Date().toISOString() };
  await writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await rename(tmp, FILE);
}

export async function joinWaitlist(input: {
  email: string;
  source?: string;
  userAgent?: string;
}): Promise<{ email: string; createdAt: string; duplicate: boolean }> {
  const email = input.email.trim().toLowerCase();
  if (!isEmail(email)) {
    throw new MeterLiveError("INVALID_EMAIL", "Provide a valid work email", 400);
  }
  return withLock(async () => {
    const file = await readAll();
    const existing = file.entries.find((e) => e.email === email);
    if (existing) {
      return { email, createdAt: existing.createdAt, duplicate: true };
    }
    const entry: WaitlistEntry = {
      email,
      createdAt: new Date().toISOString(),
      source: input.source ?? "landing",
    };
    if (input.userAgent) entry.userAgent = input.userAgent.slice(0, 200);
    file.entries.push(entry);
    await writeAll(file);
    return { email, createdAt: entry.createdAt, duplicate: false };
  });
}

export async function waitlistCount(): Promise<number> {
  const file = await readAll();
  return file.entries.length;
}
