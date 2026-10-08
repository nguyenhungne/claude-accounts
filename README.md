# cct: several Claude Code accounts on one machine

`cct` lets you run Claude Code with several accounts side by side, on Windows and macOS. Each account
(a *profile*) has its own logins for Claude and, optionally, for `gh`, `git`, `az`, `kubectl`, `npm`
and `aws`. Skills, MCP servers, plugins, settings and per-folder memory stay shared. Switching accounts
never loses any of them.

- **Run several accounts at once.** Every launch is its own process with its own environment
  variables. There is no global "current account" for two sessions to fight over.
- **Pick the account by folder.** Bind `D:\work` to `work` and `D:\personal` to `personal`, then type `cct`.
- **Your current setup stays as it is.** It becomes the `default` profile (`~/.claude`, your global
  `gh` and `git`), and `cct` never modifies it.
- **No dependencies.** It only needs Node.js 20 or newer.
- **Command line and editor UI.** Use the `cct` command, or the *Claude Accounts* sidebar for VS Code
  and Cursor. Both work on the same profiles.

---

## Contents

1. [Install](#1-install)
2. [Quick start](#2-quick-start)
3. [How `cct` picks a profile](#3-how-cct-picks-a-profile)
4. [What is separate and what is shared](#4-what-is-separate-and-what-is-shared)
5. [Command reference](#5-command-reference)
6. [profile.json](#6-profilejson)
7. [VS Code and Cursor](#7-vs-code-and-cursor)
8. [Recipes](#8-recipes)
9. [Caveats](#9-caveats)
10. [Project layout and design](#10-project-layout-and-design)

---

## 1. Install

```bash
# Windows (PowerShell) or macOS (zsh / bash)
cd D:\work\claude-tool          # wherever you keep this folder
npm install --global .          # puts `cct` on PATH (npm links the folder, so edits apply at once)
cct install                     # shell integration: `cct use`, `cct reset`, prompt marker
```

Then **open a new terminal**. In VS Code, open a new integrated terminal or reload the window.

`cct install` adds a block between `# >>> cct >>>` and `# <<< cct <<<` to:

| Platform | Files |
|---|---|
| Windows | the PowerShell 7 and Windows PowerShell `$PROFILE` (CurrentUserAllHosts), plus `~/.bashrc` for Git Bash if it exists |
| macOS / Linux | `~/.zshrc` and/or `~/.bashrc`, plus the PowerShell profile if `pwsh` is installed |

You can run it again at any time. `cct uninstall` removes the block.

Optionally, install the editor extension as well (section 7):

```bash
cd extension
npm run install-extension                     # every VS Code / Cursor found
npm run install-extension -- --editor cursor  # only Cursor
```

Without npm, you can call `node <folder>/src/cli/main.js ...` directly. Every command works that way
except `cct use` and `cct reset`, which need the shell integration.

---

## 2. Quick start

```bash
cct add personal --git-name "Jane Doe" --git-email jane@gmail.com -d "Personal Max plan"
cct login personal              # Claude first (type /login if it does not ask, then /exit), then gh
cct bind personal D:\personal   # this folder and all subfolders use 'personal'
cct list
```

From now on:

```bash
cd D:\personal\side-project
cct                 # claude with the personal account
cd D:\work\backend
cct                 # claude with the default (company) account
```

Run those two in two terminals and both accounts are working at the same time.

---

## 3. How `cct` picks a profile

`cct` with no arguments (or with only Claude flags, such as `cct -c` or `cct --resume`) resolves a
profile in this order:

1. **Active shell.** The profile you switched to with `cct use <profile>`, or the one a `cct shell` runs as.
2. **Folder binding.** The binding of the current folder or of its **closest** bound parent (`cct bind`).
3. **Menu.** Pick with the arrow keys or a number, Enter to start, Esc to cancel. `cct` then offers to
   remember the choice for the folder.

`cct <profile> [claude args]` skips all of this, for example `cct work --resume`.

`cct which` shows what `cct` would do in the current folder.

---

## 4. What is separate and what is shared

### Separate per profile

| Item | Location | When |
|---|---|---|
| Claude login and `.claude.json` (account, onboarding, UI state) | `~/.cct/profiles/<name>/claude/` | always |
| GitHub CLI | `.../<name>/gh/` | `tools` contains `gh` |
| git identity and GitHub HTTPS credentials | `.../<name>/gitconfig` | `git` |
| Azure CLI | `.../<name>/azure/` | `azure` |
| kubectl | `.../<name>/kube/config` | `kube` |
| npm (`.npmrc`, registry tokens) | `.../<name>/npmrc` | `npm` |
| AWS CLI | `.../<name>/aws/` | `aws` |

A tool that is not listed in `tools` keeps using your normal setup. `cct list` marks it as `(shared)`.

### Shared with `~/.claude` (the default)

| Item | How |
|---|---|
| `projects/`: **per-folder memory** and the transcripts used by `--resume` | directory link |
| `CLAUDE.md` (global memory), `settings.json` (permissions, hooks, status line, enabled plugins), `keybindings.json`, `history.jsonl` | file link |
| `skills/`, `agents/`, `commands/`, `output-styles/`, `plugins/`, `plans/`, `todos/`, `file-history/` | directory link |
| `ide/`, so `/ide` finds VS Code or JetBrains from every profile | directory link |
| MCP servers (user and local scope in `~/.claude.json`) and trusted folders | **one-way sync** from the default profile on every launch |

What this gives you:

- The memory of `D:\work\api` is **the same** whichever account opens it. Claude Code keeps it in
  `~/.claude/projects/<folder>/memory`, and every profile points at that folder.
- A skill or plugin installed from any profile is available in all of them.
- Project-scoped MCP (`.mcp.json` in a repository) works everywhere, as usual.

#### Links on Windows

- Directories use **junctions**, which need no admin rights.
- Files try a symbolic link first, which needs Developer Mode, and fall back to a **hard link**. When
  an application replaces a hard-linked file instead of editing it, the next `cct` launch notices and
  re-links it. The newer copy wins, and the older one goes to `~/.cct/backups/`.
- macOS uses plain symbolic links.

#### MCP

- **Add MCP servers in the default profile** (plain `claude mcp add -s user ...`). Every profile picks
  them up on its next launch.
- A server added from inside a profile only exists in that profile.
- OAuth-based servers (Atlassian, Figma, ...) and **claude.ai connectors** belong to an account. Authorize
  them once per profile with `/mcp`.

### Keeping an item separate

```bash
cct add lab --unshare settings.json,projects,mcp
# existing profile: cct edit lab  ->  "unshare": ["settings.json", "projects"]
```

The profile gets its own copy, starting from the current shared state. From then on the two copies
evolve independently. A separate `settings.json` also gets an `env` block with the profile's variables.

Items you can unshare: `settings.json, CLAUDE.md, keybindings.json, history.jsonl, projects, skills,
agents, commands, output-styles, plugins, plans, todos, file-history, ide, mcp`.

---

## 5. Command reference

`cct help` prints the same list.

### Start Claude

| Command | What it does |
|---|---|
| `cct` | resolve the profile (section 3) and start claude |
| `cct <profile> [claude args]` | for example `cct work --resume`, `cct personal -c`, `cct work -p "..."` |
| `cct -c`, `cct --resume`, ... | like `cct`, with the arguments passed to claude |
| `cct run [profile] [claude args]` | long form of the two lines above |
| `cct pick [claude args]` | always show the menu |

### Profiles

| Command | What it does |
|---|---|
| `cct list` | every profile with its Claude, GitHub and git account. `NOW` shows `active` (this shell) and `here` (this folder) |
| `cct info <profile>` | environment variables, and the state of each shared or separate item |
| `cct add <name> [options]` | create a profile, see below |
| `cct login <profile> [claude\|gh\|azure\|all]` | log in. `all` means Claude plus every separate CLI that has a login |
| `cct edit <profile>` | open `profile.json` in `$VISUAL` / `$EDITOR`, VS Code or Notepad. Re-syncs when you close it |
| `cct sync [profile]` | re-create links, gitconfig and the MCP sync now. Rarely needed, since every launch does it |
| `cct remove <profile> [--yes]` | delete a profile and its logins. Shared data in `~/.claude` is kept |

Options of `cct add`:

| Option | Default | Meaning |
|---|---|---|
| `--tools gh,git,azure,kube,npm,aws`, `all`, `none` | `gh,git` | CLIs that get their own login |
| `--git-name`, `--git-email` | asked interactively (Enter inherits `~/.gitconfig`) | commit identity |
| `--unshare a,b` | nothing | items **not** to share (section 4) |
| `-d`, `--description` | | shown in the menu and in `cct info` |
| `-y`, `--yes` | | do not ask anything |

### Folders

| Command | What it does |
|---|---|
| `cct bind <profile> [folder]` | use the profile in the folder (default: the current folder) and all its subfolders. Deeper bindings win |
| `cct unbind [folder]` | remove a binding |
| `cct bindings` | list bindings |
| `cct which` | what `cct` would do here |

Bind `default` to a subfolder to opt out of a parent binding: `cct bind default D:\personal\company-fork`.

### Other CLIs

| Command | What it does |
|---|---|
| `cct exec <profile> <cmd> [args]` | for example `cct exec personal gh pr list`, `cct exec work az account show` |
| `cct shell <profile>` | a new shell (pwsh or your login shell) running as the profile. The prompt shows `[cct:name]`. Type `exit` to leave |
| `cct use <profile>` | switch the **current** shell to the profile (needs `cct install`) |
| `cct reset` | switch the current shell back to the default profile |
| `cct env <profile> [--shell pwsh\|zsh\|bash]` | print the assignments: `cct env work \| iex` or `eval "$(cct env work)"` |
| `cct code <profile> [folder] [--editor code\|cursor]` | a VS Code or Cursor window as the profile (section 7). Without `--editor`, the first installed editor is used |

When Claude runs as a profile, the commands it runs through its Bash or PowerShell tool (`gh pr create`,
`git push`, `az ...`) run as that profile too, because child processes inherit the environment.

### Setup

| Command | What it does |
|---|---|
| `cct install` / `cct uninstall` | add or remove the shell integration |
| `cct init <pwsh\|zsh\|bash>` | print the integration script, if you prefer to paste it yourself |
| `cct version`, `cct help` | |

---

## 6. profile.json

`~/.cct/profiles/<name>/profile.json`:

```json
{
  "description": "Personal Max plan",
  "tools": ["gh", "git"],
  "git": { "name": "Jane Doe", "email": "jane@gmail.com" },
  "env": {
    "ANTHROPIC_MODEL": "claude-opus-5-5",
    "MY_TOKEN_FILE": "~/secrets/personal-token.txt"
  },
  "unshare": [],
  "created": "2026-10-08 13:00"
}
```

- `env` adds any environment variable to the profile. Values may use `~`, `%VAR%` and `${VAR}`.
  **Do not put secrets here.** Point to a file, or use your secrets manager.
- `cct edit` re-syncs when you save. After any other edit, run `cct sync`, or let the next launch do it.

### git

In a profile, `GIT_CONFIG_GLOBAL` points to `~/.cct/profiles/<name>/gitconfig`. That file includes:

1. `gitconfig.cct`, which `cct` regenerates on every launch. It includes your original `~/.gitconfig`
   (aliases, editor and so on still work), adds the profile's `[user]`, and makes the profile's `gh`
   the credential helper for GitHub.
2. Everything below the include belongs to you. `git config --global ...` inside the profile writes there.

As a result, `git push` over HTTPS to GitHub uses the profile's `gh` token, not whatever is stored in
Windows Credential Manager or the macOS Keychain.

Check the effective identity with `cct exec <profile> git config user.email`. Leave out `--global`:
git ignores includes when you ask for a single file.

**SSH:** use a host alias in `~/.ssh/config` as usual, or add this to the profile's `gitconfig`:

```ini
[core]
    sshCommand = ssh -i ~/.ssh/id_ed25519_personal -o IdentitiesOnly=yes
```

### gh

For a non-default profile, `cct login <profile> gh` runs `gh auth login --insecure-storage`. gh keeps
its *active* token under a single entry in Windows Credential Manager or the macOS Keychain, and that
entry is shared by every config directory. If you logged in to a second profile through the keychain,
you would overwrite the first one. The token is therefore stored in `~/.cct/profiles/<name>/gh/hosts.yml`
inside your user folder. The default profile keeps using the keychain as before.

---

## 7. VS Code and Cursor

### The Claude Accounts extension

The `extension/` folder contains a sidebar for VS Code and Cursor. It uses the same core library and
the same `~/.cct` data as the command line.

| Where | What you get |
|---|---|
| Activity bar, **Claude Accounts** | every profile with its Claude account, GitHub user, git email, separate CLIs and bound folders. The profile used for the current folder has a green check |
| Inline buttons on a profile | **Start Claude** (an editor tab or panel terminal running `claude` as the profile) and **Open Terminal** |
| Right-click on a profile | Open New Window as, Log In, Use for a Workspace Folder, Edit profile.json, Reveal Profile Folder, Remove |
| View title bar | Start Claude for This Folder, Add Profile (a short wizard), Refresh |
| Status bar | the account of the current folder. Click it to start Claude, or to choose an account and remember it for the folder |
| "Claude: not logged in" row | click it to log in |
| Bound folder row | an inline button removes the binding |

Saving a `profile.json` in the editor re-syncs that profile. The view refreshes when the window gets
focus and when one of its terminals closes.

Settings: `cct.dataDirectory` (same as `CCT_HOME`), `cct.claudeTerminalLocation` (`editor` or `panel`),
`cct.showStatusBarItem`.

Install with `npm run install-extension` inside `extension/`, then reload the window.

### The Claude Code extension panel

The Claude Code extension itself uses the environment of the editor window. Terminals opened by the
sidebar can run as any profile, but the Claude Code *panel* follows the window. To get the panel as
another account, use **Open New Window as...** (or `cct code personal D:\personal\repo --editor cursor`).
It opens a separate window with its own user-data folder: settings, keybindings and snippets are copied
from your main editor on the first run, and extensions are shared. Every terminal and the Claude
extension in that window run as `personal`, while your normal windows stay on the default account.

`/ide` works from every profile, because the `ide/` folder is shared.

---

## 8. Recipes

```bash
# Overview
cct list

# Continue a session with the other account (for example when one hits its usage limit)
cct personal --resume        # transcripts are shared, so the other account's sessions are listed too

# Open a PR as your personal GitHub user without switching anything
cct exec personal gh pr create --fill

# Work as the personal account in the current terminal for a while
cct use personal
gh auth status; git config user.email; claude
cct reset

# A throw-away profile with its own memory and settings
cct add sandbox --tools none --unshare projects,settings.json,CLAUDE.md -y
```

---

## 9. Caveats

- **macOS Keychain:** on macOS, Claude Code stores its login in the Keychain and uses a separate entry
  when `CLAUDE_CONFIG_DIR` is set. After logging in to two profiles, `cct list` should show two
  different emails in the CLAUDE column.
- **Concurrent writes:** shared items (memory, history, plugins) are written concurrently, exactly as
  when you run several sessions of one account. Avoid installing or removing plugins from two profiles
  at the same moment.
- **The MCP sync is one-way** (default to profile), and it only adds or updates servers. If you delete a
  server in the default profile, run `claude mcp remove ...` inside the profile too.
- `cct remove` only deletes tokens locally. Revoke them on claude.ai or github.com if needed.
- Set `CCT_HOME` to keep `cct` data somewhere other than `~/.cct`.
- **Uninstall:** run `cct uninstall` and `npm uninstall --global claude-account-switcher`, then delete
  `~/.cct` if you also want the profiles gone. `~/.claude` is not affected.

---

## 10. Project layout and design

```
claude-tool/
  package.json                       bin: cct -> src/cli/main.js, npm test
  src/
    core/                            library, no terminal or editor output
      index.js                       public API used by the extension
      createServices.js              composition root: wires every service
      config/AppPaths.js             ~/.cct layout
      errors/CctError.js             expected, user-facing errors
      text/Text.js
      platform/                      Platform, ExecutableLocator, ProcessRunner
      fileSystem/FileSystem.js       atomic writes, links, path comparison
      profiles/                      Profile (model), ProfileRepository, ProfileDirectories,
                                     ProfileLifecycle (create / remove), ReservedProfileNames
      environment/                   EnvironmentVariables, EnvironmentBaseline, ProfileEnvironmentBuilder
      tools/                         IsolatedTools (one strategy per CLI), GitConfigWriter
      sharing/                       SharedClaudeItems, ClaudeItemLinker, McpConfigurationSynchronizer,
                                     SettingsEnvironmentWriter, ProfileSynchronizer (facade)
      bindings/                      FolderBindingRepository, ProfileResolver (rule chain)
      accounts/                      AccountInspector, ProfileOverviewService (what the list and sidebar show)
      login/LoginPlanner.js          which logins a profile has and how to run them
      editors/                       EditorFlavors (VS Code, Cursor), EditorWindowLauncher
      shell/                         ShellDialects (pwsh / zsh / bash), ShellIntegrationInstaller
    cli/
      main.js                        entry point and dispatch
      Command.js, CommandRegistry.js, createCommandRegistry.js
      ArgumentParser.js, ProfileSession.js, ClaudeLauncher.js
      output/                        Terminal, TableRenderer, InteractivePrompt
      commands/                      one class per command (AddProfileCommand, LoginCommand, ...)
  extension/                         VS Code / Cursor extension (CommonJS, loads the core with import())
    package.json                     manifest: views, commands, menus, settings
    src/
      extension.js                   activate()
      ClaudeAccountsExtension.js     composition root and event wiring
      CoreLoader.js, EditorDetection.js, WorkspaceFolders.js
      views/                         ProfileTreeDataProvider, ProfileTreeItemFactory, ProfileStatusBarItem
      terminals/                     ProfileTerminalLauncher
      pickers/                       ProfilePicker, WorkspaceFolderPicker
      wizards/                       AddProfileWizard
      commands/                      one class per command + registerCommands
    scripts/                         bundleCore (copies src/core into the package), installExtension
  tests/                             node:test suites
    support/                         TemporaryWorkspace, FakeVsCode (stand-in for the vscode API)
    extension/                       extension tests running against the fake API
```

| Pattern | Where | Why |
|---|---|---|
| Command + registry | `cli/commands/*`, `extension/src/commands/*` | one class per command. CLI help comes from the registry, and a test keeps the reserved profile names in sync with it |
| Repository | `ProfileRepository`, `FolderBindingRepository` | storage is hidden behind `get`, `list`, `create`, `bind`, ... |
| Strategy | `IsolatedTools` (one entry per CLI), `ShellDialects` (pwsh / zsh / bash), `EditorFlavors` (VS Code / Cursor) | adding a CLI, a shell or an editor means adding one object |
| Chain of responsibility | `ProfileResolver` with `ActiveShellRule` then `FolderBindingRule` | resolution order in one place, easy to extend |
| Facade | `ProfileSynchronizer` | one `synchronize(profile)` call runs links, gitconfig, MCP and settings, and returns warnings instead of printing |
| Application services | `ProfileLifecycle`, `ProfileOverviewService`, `LoginPlanner`, `EditorWindowLauncher` | the CLI and the extension share the same behaviour and differ only in presentation |
| Composition root / dependency injection | `core/createServices.js`, the CLI `context`, `ClaudeAccountsExtension` | tests build the same services on a temporary folder, and the extension tests run against a fake `vscode` module |

Run the tests with `npm test`. They use temporary folders and never touch your real `~/.claude`.

Adding a new isolated CLI means adding one `IsolatedTool` entry in `src/core/tools/IsolatedTools.js`
(id, environment variables, folders, optional login arguments). The CLI, the wizard and the login menu
pick it up from there.
