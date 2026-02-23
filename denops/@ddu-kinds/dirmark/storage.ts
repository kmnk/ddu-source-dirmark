/**
 * Storage module for ddu-source-dirmark.
 *
 * Manages persistence of directory marks as a JSON file.
 * Default location: ~/.cache/ddu-source-dirmark/dirmarks.json
 * Configurable via `ddu_source_dirmark#set_data_directory_path()`.
 */

import { join } from "@std/path/join";

/** The reserved group name assigned when no group is specified. */
export const DEFAULT_GROUP = "default";

/** A single directory mark entry. */
export type Mark = {
  /** The group this mark belongs to. */
  group: string;
  /** Absolute path to the marked directory. */
  path: string;
  /** Optional human-readable name for the mark. */
  name?: string;
};

/** The top-level data structure persisted to disk. */
export type DirmarkData = {
  marks: Mark[];
};

const DATA_FILE_NAME = "dirmarks.json";

/**
 * Returns the default data directory path.
 * Uses $HOME on Unix-like systems, $USERPROFILE on Windows.
 */
export function getDefaultDataDir(): string {
  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? "";
  return join(home, ".cache", "ddu-source-dirmark");
}

/**
 * Reads the data directory path from the Vim global variable
 * `g:ddu_source_dirmark_data_dir`, falling back to the default.
 */
export async function resolveDataDir(
  denops: { eval(expr: string): Promise<unknown> },
): Promise<string> {
  const custom = await denops.eval(
    "get(g:, 'ddu_source_dirmark_data_dir', '')",
  ) as string;
  return custom.trim() || getDefaultDataDir();
}

/**
 * Loads mark data from disk.
 * Returns an empty dataset if the file does not exist or is malformed.
 */
export async function loadData(dataDir: string): Promise<DirmarkData> {
  const dataFile = join(dataDir, DATA_FILE_NAME);
  try {
    const text = await Deno.readTextFile(dataFile);
    const parsed = JSON.parse(text) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "marks" in parsed &&
      Array.isArray((parsed as { marks: unknown }).marks)
    ) {
      return parsed as DirmarkData;
    }
  } catch {
    // File not found or invalid JSON — return empty data
  }
  return { marks: [] };
}

/**
 * Persists mark data to disk, creating the data directory if needed.
 */
export async function saveData(
  dataDir: string,
  data: DirmarkData,
): Promise<void> {
  await Deno.mkdir(dataDir, { recursive: true });
  const dataFile = join(dataDir, DATA_FILE_NAME);
  await Deno.writeTextFile(dataFile, JSON.stringify(data, null, 2) + "\n");
}

/**
 * Adds a mark. Returns `false` if an identical path+group entry already exists.
 */
export async function addMark(
  dataDir: string,
  path: string,
  group: string,
  name?: string,
): Promise<boolean> {
  const data = await loadData(dataDir);
  const exists = data.marks.some((m) => m.path === path && m.group === group);
  if (exists) return false;
  const mark: Mark = { group, path };
  if (name) mark.name = name;
  data.marks.push(mark);
  await saveData(dataDir, data);
  return true;
}

/**
 * Removes all marks that match the given path and group.
 */
export async function deleteMark(
  dataDir: string,
  path: string,
  group: string,
): Promise<void> {
  const data = await loadData(dataDir);
  data.marks = data.marks.filter(
    (m) => !(m.path === path && m.group === group),
  );
  await saveData(dataDir, data);
}

/** Returns a sorted, deduplicated list of all group names. */
export function getGroups(data: DirmarkData): string[] {
  const groups = new Set(data.marks.map((m) => m.group));
  return [...groups].sort();
}

/** Returns all marks belonging to the specified group. */
export function getMarksByGroup(data: DirmarkData, group: string): Mark[] {
  return data.marks.filter((m) => m.group === group);
}
