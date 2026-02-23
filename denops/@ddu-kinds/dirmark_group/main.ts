/**
 * ddu-kind-dirmark_group
 *
 * Kind plugin for ddu.vim that handles dirmark group items.
 *
 * Actions:
 *   - open : Start a ddu session listing the marks in the selected group.
 */

import { BaseKind } from "@shougo/ddu-vim/kind";
import { ActionFlags, type Actions } from "@shougo/ddu-vim/types";

/** Action data carried by each dirmark_group item. */
export type ActionData = {
  /** The group name. Empty string for placeholder items. */
  group: string;
};

/** Kind parameters. */
type Params = {
  /**
   * Override the data directory path passed to the child ddu-source-dirmark.
   * When empty, the child source uses its own default resolution.
   */
  dataDir: string;
};

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    /**
     * Open a new ddu session that lists marks belonging to the selected group.
     * Placeholder items (empty group) are ignored.
     */
    open: {
      description:
        "Open a ddu session listing the marks in the selected group.",
      callback: async (args) => {
        const item = args.items[0];
        const action = item?.action as ActionData | undefined;
        if (!action?.group) return ActionFlags.Persist;

        const sourceParams: Record<string, unknown> = { group: action.group };
        if ((args.kindParams as Params).dataDir) {
          sourceParams["dataDir"] = (args.kindParams as Params).dataDir;
        }

        await args.denops.call("ddu#start", {
          sources: [{ name: "dirmark", params: sourceParams }],
        });
        return ActionFlags.None;
      },
    },
  };

  override params(): Params {
    return { dataDir: "" };
  }
}
