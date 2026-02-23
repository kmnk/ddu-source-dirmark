# ddu-source-dirmark

A [ddu.vim](https://github.com/Shougo/ddu.vim) plugin for managing bookmarked directories (dirmarks).

> Assisted by [Claude Code](https://claude.ai/claude-code) (Anthropic)

## Overview

This plugin provides two sources and two kinds for organizing and navigating directory bookmarks.

| Component | Description |
|---|---|
| `ddu-source-dirmark` | Lists marked directories in a group |
| `ddu-source-dirmark_group` | Lists all groups |
| `ddu-kind-dirmark` | Actions for directory marks (open, cd, add, delete) |
| `ddu-kind-dirmark_group` | Actions for groups (open marks in group) |

Each mark stores a directory path, an optional human-readable **name**, and belongs to a **group**.
Marks are organized into named groups. The reserved group `"default"` is used when no group is specified.

When the mark list is empty, a placeholder item is displayed so that the `add` action remains accessible from the ddu UI.

## Requirements

- [ddu.vim](https://github.com/Shougo/ddu.vim)
- [denops.vim](https://github.com/vim-denops/denops.vim)

## Installation

Using [lazy.nvim](https://github.com/folke/lazy.nvim):

```lua
{
  "kmnk/ddu-source-dirmark",
  dependencies = { "Shougo/ddu.vim", "vim-denops/denops.vim" },
}
```

## Usage

### List marks in the default group

```vim
call ddu#start(#{sources: [#{name: 'dirmark'}]})
```

### List marks in a specific group

```vim
call ddu#start(#{sources: [#{name: 'dirmark', params: #{group: 'work'}}]})
```

### List all groups

```vim
call ddu#start(#{sources: [#{name: 'dirmark_group'}]})
```

### Change the data directory

```vim
call ddu_source_dirmark#set_data_directory_path('~/.local/share/dirmark')
```

## Available Actions

### `ddu-kind-dirmark`

| Action | Description |
|---|---|
| `open` | Open the directory in a new ddu session (using ddu-source-file) |
| `cd` | Change the working directory to the marked path |
| `add` | Interactively register a new directory mark (prompts for path, group, name) |
| `delete` | Remove the selected marks |

### `ddu-kind-dirmark_group`

| Action | Description |
|---|---|
| `open` | Open a new ddu session listing marks in the selected group |

## Source Parameters

### `ddu-source-dirmark`

| Parameter | Default | Description |
|---|---|---|
| `group` | `""` | Group to list. Empty means the `"default"` group. |
| `dataDir` | `""` | Override the data directory path. |
| `highlights.name` | `"Identifier"` | Highlight group for the name column. |
| `highlights.placeholder` | `"Comment"` | Highlight group for the empty-state placeholder. |

### `ddu-source-dirmark_group`

| Parameter | Default | Description |
|---|---|---|
| `dataDir` | `""` | Override the data directory path. |
| `highlights.placeholder` | `"Comment"` | Highlight group for the empty-state placeholder. |

## Display Format

When a mark has a name, the ddu item displays as:

```
{name}    {path}
```

The `word` field (used for filtering) is the name when set, otherwise the path.

## Storage

Mark data is stored as JSON (default: `~/.cache/ddu-source-dirmark/dirmarks.json`):

```json
{
  "marks": [
    { "group": "default", "path": "/home/user/projects" },
    { "group": "work",    "path": "/home/user/work/repo", "name": "my-repo" }
  ]
}
```

The data directory can be changed with:

```vim
call ddu_source_dirmark#set_data_directory_path('/path/to/dir')
" or directly:
let g:ddu_source_dirmark_data_dir = '/path/to/dir'
```

## License

MIT
