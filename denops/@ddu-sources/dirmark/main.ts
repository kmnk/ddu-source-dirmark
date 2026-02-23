/**
 * ddu-source-dirmark
 *
 * Source plugin for ddu.vim that lists marked directories.
 * Items use ddu-kind-dirmark for actions (open, cd, add, delete).
 *
 * When no group is specified, marks in the "default" group are listed.
 * When a group is specified, only marks belonging to that group are listed.
 * When no marks exist, a placeholder item is emitted so that kind actions
 * (e.g. "add") remain accessible from the ddu UI.
 */

import type { Item, ItemHighlight } from "@shougo/ddu-vim/types";
import { BaseSource } from "@shougo/ddu-vim/source";
import type { Denops } from "@denops/std";

import type { ActionData } from "@kmnk/ddu-kind-dirmark";
import {
  DEFAULT_GROUP,
  getMarksByGroup,
  loadData,
  resolveDataDir,
} from "@kmnk/ddu-kind-dirmark/storage";

/** Source parameters. */
type Params = {
  /**
   * The group whose marks are listed.
   * When empty, marks in the "default" group are shown.
   */
  group: string;

  /**
   * Override the data directory path.
   * When empty, the value of `g:ddu_source_dirmark_data_dir` is used,
   * or ~/.cache/ddu-source-dirmark as the default.
   */
  dataDir: string;

  highlights: {
    /** Highlight group applied to the name column. Default: "Identifier". */
    name: string;
    /** Highlight group applied to the empty-state placeholder row. Default: "Comment". */
    placeholder: string;
  };
};

export class Source extends BaseSource<Params> {
  override kind = "dirmark";

  override gather(args: {
    denops: Denops;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    const { highlights } = args.sourceParams;
    return new ReadableStream({
      async start(controller) {
        const dataDir = args.sourceParams.dataDir ||
          await resolveDataDir(args.denops);
        const group = args.sourceParams.group || DEFAULT_GROUP;

        const data = await loadData(dataDir);
        const marks = getMarksByGroup(data, group);

        const enc = new TextEncoder();
        const items: Item<ActionData>[] = marks.map((mark) => {
          const itemHighlights: ItemHighlight[] = [];
          let word: string;
          let display: string | undefined;

          if (mark.name) {
            word = mark.name;
            display = `${mark.name}\t${mark.path}`;
            if (highlights.name !== "") {
              itemHighlights.push({
                name: "ddu-source-dirmark-name",
                hl_group: highlights.name,
                col: 1,
                width: enc.encode(mark.name).length,
              });
            }
          } else {
            word = mark.path;
          }

          return {
            word,
            display,
            highlights: itemHighlights.length > 0 ? itemHighlights : undefined,
            action: {
              path: mark.path,
              group: mark.group,
              name: mark.name,
            },
          };
        });

        if (items.length === 0) {
          const placeholderText = "(No marks registered)";
          const itemHighlights: ItemHighlight[] = [];
          if (highlights.placeholder !== "") {
            itemHighlights.push({
              name: "ddu-source-dirmark-placeholder",
              hl_group: highlights.placeholder,
              col: 1,
              width: enc.encode(placeholderText).length,
            });
          }
          items.push({
            word: placeholderText,
            highlights: itemHighlights,
            action: {
              path: "",
              group: "",
              isPlaceholder: true,
            },
          });
        }

        controller.enqueue(items);
        controller.close();
      },
    });
  }

  override params(): Params {
    return {
      group: "",
      dataDir: "",
      highlights: {
        name: "Identifier",
        placeholder: "Comment",
      },
    };
  }
}
