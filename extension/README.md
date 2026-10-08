# Claude Accounts (cct)

A VS Code and Cursor sidebar for `cct` (see the README at the repository root): run Claude Code with several accounts side by side,
with the account chosen per workspace folder.

## Features

- **Profiles view** in the activity bar. Each profile shows its Claude account, GitHub user, git email,
  separate CLIs and bound folders. Inline buttons start Claude or open a terminal as that profile.
- **Status bar item** with the account used for the current folder. Click it to start Claude.
- **Add Profile wizard**: name, CLIs with their own login, git identity, description.
- **Log in** to Claude, GitHub CLI or Azure CLI, each in its own terminal running as the profile.
- **Use for a workspace folder**: bind a folder, so Claude, the status bar and the `cct` command line
  all pick that profile there.
- **Open New Window as profile**: a separate window (own window state, shared extensions) where every
  terminal and the Claude Code extension use that account.
- Edit `profile.json` in the editor. Saving it re-syncs the profile.

Profiles, bindings and the shared `~/.claude` items are the same ones the `cct` command line uses.

## Install

```bash
cd extension
npm run install-extension                   # packages and installs into every VS Code / Cursor found
npm run install-extension -- --editor cursor
```

Reload the window afterwards.

## Settings

| Setting | Default | |
|---|---|---|
| `cct.dataDirectory` | empty (`CCT_HOME` or `~/.cct`) | where profiles and bindings live |
| `cct.claudeTerminalLocation` | `editor` | open Claude in an editor tab or in the terminal panel |
| `cct.showStatusBarItem` | `true` | show the current folder's account in the status bar |
