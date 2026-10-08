const path = require('node:path');
const { registerCommands } = require('./commands/registerCommands');
const { detectCurrentEditor } = require('./EditorDetection');
const { ProfilePicker } = require('./pickers/ProfilePicker');
const { WorkspaceFolderPicker } = require('./pickers/WorkspaceFolderPicker');
const { ProfileTerminalLauncher } = require('./terminals/ProfileTerminalLauncher');
const { ProfileStatusBarItem } = require('./views/ProfileStatusBarItem');
const { ProfileTreeDataProvider } = require('./views/ProfileTreeDataProvider');
const { ProfileTreeItemFactory } = require('./views/ProfileTreeItemFactory');
const { WorkspaceFolders } = require('./WorkspaceFolders');

const CONFIGURATION_SECTION = 'cct';
const PROFILES_VIEW_ID = 'cct.profiles';

class ClaudeAccountsExtension {
  constructor({ vscode, context, core }) {
    this.vscode = vscode;
    this.context = context;
    this.core = core;
  }

  start() {
    const { vscode } = this;
    this.output = vscode.window.createOutputChannel('Claude Accounts');
    this.services = this.#createServices();
    this.editor = detectCurrentEditor(vscode, this.core);
    this.workspaceFolders = new WorkspaceFolders(vscode);
    this.terminals = new ProfileTerminalLauncher(this);
    this.profilePicker = new ProfilePicker(this);
    this.folderPicker = new WorkspaceFolderPicker(this);
    this.treeProvider = new ProfileTreeDataProvider(this, new ProfileTreeItemFactory(vscode));
    this.statusBar = new ProfileStatusBarItem(this);
    const treeView = vscode.window.createTreeView(PROFILES_VIEW_ID, { treeDataProvider: this.treeProvider, showCollapseAll: true });

    this.context.subscriptions.push(
      this.output,
      treeView,
      this.statusBar,
      ...registerCommands(this),
      ...this.#registerListeners(),
    );
    this.refresh();
  }

  get configuration() {
    return this.vscode.workspace.getConfiguration(CONFIGURATION_SECTION);
  }

  refresh() {
    this.treeProvider.refresh();
    this.statusBar.update();
  }

  synchronize(profile) {
    const warnings = this.services.synchronizer.synchronize(profile);
    if (warnings.length === 0) return;
    for (const warning of warnings) this.output.appendLine(`[${profile.name}] ${warning}`);
    this.vscode.window
      .showWarningMessage(`Claude Accounts: '${profile.name}' synced with ${warnings.length} warning(s).`, 'Show Details')
      .then(choice => choice && this.output.show());
  }

  #createServices() {
    const dataDirectory = this.configuration.get('dataDirectory', '').trim();
    const environment = dataDirectory ? { ...process.env, CCT_HOME: dataDirectory } : process.env;
    return this.core.createServices({ environment });
  }

  #registerListeners() {
    const { window, workspace } = this.vscode;
    return [
      window.onDidChangeActiveTextEditor(() => this.statusBar.update()),
      window.onDidChangeWindowState(state => state.focused && this.refresh()),
      window.onDidCloseTerminal(terminal => this.terminals.forget(terminal) && this.refresh()),
      workspace.onDidChangeWorkspaceFolders(() => this.refresh()),
      workspace.onDidSaveTextDocument(document => this.#synchronizeSavedProfile(document.uri.fsPath)),
      workspace.onDidChangeConfiguration(event => {
        if (!event.affectsConfiguration(CONFIGURATION_SECTION)) return;
        this.services = this.#createServices();
        this.refresh();
      }),
    ];
  }

  #synchronizeSavedProfile(savedFile) {
    if (path.basename(savedFile) !== 'profile.json') return;
    const profileFolder = path.dirname(savedFile);
    if (!this.core.pathsEqual(path.dirname(profileFolder), this.services.appPaths.profilesDirectory)) return;
    try {
      const profile = this.services.profiles.get(path.basename(profileFolder));
      this.synchronize(profile);
      this.refresh();
      this.vscode.window.setStatusBarMessage(`$(check) Claude Accounts: '${profile.name}' synced`, 3000);
    } catch (error) {
      this.vscode.window.showErrorMessage(`Claude Accounts: ${error.message}`);
    }
  }
}

module.exports = { ClaudeAccountsExtension };
