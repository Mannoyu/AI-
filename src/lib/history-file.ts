/**
 * Server-side JSON file persistence for history records.
 *
 * Stores records in .data/history.json at the project root.
 * Thread-safe: uses a write queue to serialize concurrent writes.
 */

import { promises as fs } from "fs";
import path from "path";
import type { HistoryRecord } from "@/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");

/** Ensure the data directory and file exist. */
async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(HISTORY_FILE);
  } catch {
    await fs.writeFile(HISTORY_FILE, "[]", "utf-8");
  }
}

// Write queue to serialize concurrent writes
let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(fn: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(fn, fn);
  return writeQueue;
}

/** Read all history records from the JSON file. */
export async function readHistory(): Promise<HistoryRecord[]> {
  await ensureFile();
  const raw = await fs.readFile(HISTORY_FILE, "utf-8");
  try {
    return JSON.parse(raw) as HistoryRecord[];
  } catch {
    return [];
  }
}

/** Write all history records to the JSON file (atomic via temp file). */
export async function writeHistory(records: HistoryRecord[]): Promise<void> {
  await ensureFile();
  const tmp = HISTORY_FILE + ".tmp";
  return enqueueWrite(async () => {
    await fs.writeFile(tmp, JSON.stringify(records, null, 2), "utf-8");
    await fs.rename(tmp, HISTORY_FILE);
  });
}

/** Add a new record (prepends to the list). */
export async function addHistoryRecord(
  record: HistoryRecord
): Promise<HistoryRecord[]> {
  const records = await readHistory();
  records.unshift(record);
  await writeHistory(records);
  return records;
}

/** Delete a record by ID. */
export async function deleteHistoryRecord(
  id: string
): Promise<HistoryRecord[]> {
  const records = await readHistory();
  const filtered = records.filter((r) => r.id !== id);
  if (filtered.length === records.length) return records; // no change
  await writeHistory(filtered);
  return filtered;
}

/** Clear all history records. */
export async function clearHistory(): Promise<void> {
  await writeHistory([]);
}
