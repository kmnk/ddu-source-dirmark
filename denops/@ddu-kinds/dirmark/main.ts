/**
 * ddu-kind-dirmark
 *
 * Kind plugin for ddu.vim that handles marked directory items.
 *
 * Actions:
 *   - open   : Open the directory in a new ddu session using ddu-source-file.
 *   - cd     : Change the current working directory to the marked path.
 *   - add    : Interactively register a new directory mark.
 *   - delete : Remove the selected marks from storage.
 */

import * as fn from "@denops/std/function";
import { BaseKind } from "@shougo/ddu-vim/kind";
import { ActionFlags, type Actions } from "@shougo/ddu-vim/types";

import {
  addMark,
  DEFAULT_GROUP,
  deleteMark,
  resolveDataDir,
} from "./storage.ts";

/** Action data carried by each dirmark item. */
export type ActionData = {
  /** Absolute path to the marked directory. */
  path: string;
  /** Group this mark belongs to. */
  group: string;
  /** Optional human-readable name for the mark. */
  name?: string;
  /** True for the empty-state placeholder item. Not a real mark. */
  isPlaceholder?: boolean;
};

/** Kind parameters. */
type Params = {
  /**
   * Override the data directory path.
   * When empty, the value of `g:ddu_source_dirmark_data_dir` is used,
   * or ~/.cache/ddu-source-dirmark as the default.
   */
  dataDir: string;
};

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    /**
     * Open the marked directory in a new ddu session using ddu-source-file.
     */
    open: {
      description: "Open the directory in a new ddu session.",
      callback: async (args) => {
        for (const item of args.items) {
          const action = item.action as ActionData | undefined;
          if (!action?.path || action.isPlaceholder) continue;
          await args.denops.call("ddu#start", {
            sources: [{ name: "file", params: {} }],
            sourceOptions: {
              file: { path: action.path },
            },
          });
        }
        return ActionFlags.None;
      },
    },

    /**
     * Change the current working directory to the marked directory.
     */
    cd: {
      description: "Change the working directory to the marked path.",
      callback: async (args) => {
        const item = args.items[0];
        const action = item?.action as ActionData | undefined;
        if (!action?.path || action.isPlaceholder) return ActionFlags.Persist;
        await fn.chdir(args.denops, action.path);
        return ActionFlags.None;
      },
    },

    /**
     * Interactively add a new directory mark.
     * Prompts for a path (defaults to cwd) and a group name.
     * The group name "default" is reserved and cannot be entered directly;
     * leave the group field empty to assign to the default group.
     */
    add: {
      description: "Interactively register a new directory mark.",
      callback: async (args) => {
        const dataDir = (args.kindParams as Params).dataDir ||
          await resolveDataDir(args.denops);

        const cwd = await fn.getcwd(args.denops) as string;
        const rawPath = await fn.input(
          args.denops,
          "Directory path: ",
          cwd,
          "dir",
        ) as string;
        const path = rawPath.trim();
        if (!path) return ActionFlags.Persist;

        const rawGroup = await fn.input(
          args.denops,
          `Group (leave empty for "${DEFAULT_GROUP}"): `,
        ) as string;
        const group = rawGroup.trim();

        if (group === DEFAULT_GROUP) {
          await args.denops.cmd(
            `echohl WarningMsg | echomsg '"${DEFAULT_GROUP}" is reserved. Leave the field empty to use the default group.' | echohl None`,
          );
          return ActionFlags.Persist;
        }

        const finalGroup = group || DEFAULT_GROUP;

        const rawName = await fn.input(
          args.denops,
          "Name (optional): ",
        ) as string;
        const name = rawName.trim() || undefined;

        await addMark(dataDir, path, finalGroup, name);
        return ActionFlags.RefreshItems;
      },
    },

    /**
     * Delete the selected directory marks from storage.
     * Placeholder items are ignored.
     */
    delete: {
      description: "Remove the selected marks from storage.",
      callback: async (args) => {
        const dataDir = (args.kindParams as Params).dataDir ||
          await resolveDataDir(args.denops);
        const realItems = args.items.filter(
          (item) => !(item.action as ActionData).isPlaceholder,
        );
        if (realItems.length === 0) return ActionFlags.Persist;
        for (const item of realItems) {
          const action = item.action as ActionData;
          await deleteMark(dataDir, action.path, action.group);
        }
        return ActionFlags.RefreshItems;
      },
    },
  };

  override params(): Params {
    return { dataDir: "" };
  }
}
