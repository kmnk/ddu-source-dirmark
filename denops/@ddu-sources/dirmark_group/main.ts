/**
 * ddu-source-dirmark_group
 *
 * Source plugin for ddu.vim that lists all dirmark groups.
 * Items use ddu-kind-dirmark_group for actions (open).
 *
 * When no groups exist, a placeholder item is emitted so that the ddu UI
 * remains usable and the "open" action on the placeholder is a no-op.
 */

import type { Item, ItemHighlight } from "@shougo/ddu-vim/types";
import { BaseSource } from "@shougo/ddu-vim/source";
import type { Denops } from "@denops/std";

import type { ActionData } from "@kmnk/ddu-kind-dirmark_group";
import {
  getGroups,
  loadData,
  resolveDataDir,
} from "@kmnk/ddu-kind-dirmark/storage";

/** Source parameters. */
type Params = {
  /**
   * Override the data directory path.
   * When empty, the value of `g:ddu_source_dirmark_data_dir` is used,
   * or ~/.cache/ddu-source-dirmark as the default.
   */
  dataDir: string;

  highlights: {
    /** Highlight group applied to the empty-state placeholder row. Default: "Comment". */
    placeholder: string;
  };
};

export class Source extends BaseSource<Params> {
  override kind = "dirmark_group";

  override gather(args: {
    denops: Denops;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    const { highlights } = args.sourceParams;
    return new ReadableStream({
      async start(controller) {
        const dataDir = args.sourceParams.dataDir ||
          await resolveDataDir(args.denops);

        const data = await loadData(dataDir);
        const groups = getGroups(data);

        const items: Item<ActionData>[] = groups.map((group) => ({
          word: group,
          action: { group },
        }));

        if (items.length === 0) {
          const enc = new TextEncoder();
          const placeholderText = "(No marks registered)";
          const itemHighlights: ItemHighlight[] = [];
          if (highlights.placeholder !== "") {
            itemHighlights.push({
              name: "ddu-source-dirmark_group-placeholder",
              hl_group: highlights.placeholder,
              col: 1,
              width: enc.encode(placeholderText).length,
            });
          }
          items.push({
            word: placeholderText,
            highlights: itemHighlights,
            action: { group: "" },
          });
        }

        controller.enqueue(items);
        controller.close();
      },
    });
  }

  override params(): Params {
    return {
      dataDir: "",
      highlights: {
        placeholder: "Comment",
      },
    };
  }
}
