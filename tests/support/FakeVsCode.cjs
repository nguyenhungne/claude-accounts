class EventEmitter {
  constructor() {
    this.listeners = [];
    this.event = listener => {
      this.listeners.push(listener);
      return { dispose: () => {} };
    };
  }

  fire(value) {
    for (const listener of this.listeners) listener(value);
  }

  dispose() {}
}

class TreeItem {
  constructor(label, collapsibleState) {
    this.label = label;
    this.collapsibleState = collapsibleState;
  }
}

class ThemeIcon {
  constructor(id, color) {
    this.id = id;
    this.color = color;
  }
}

class ThemeColor {
  constructor(id) {
    this.id = id;
  }
}

class MarkdownString {
  constructor(value = '') {
    this.value = value;
  }

  appendMarkdown(text) {
    this.value += text;
    return this;
  }
}

const recorded = {
  commands: new Map(),
  treeViews: [],
  statusBarItems: [],
  terminals: [],
  informationMessages: [],
  warningMessages: [],
  errorMessages: [],
  eventHandlers: {},
};
const scriptedAnswers = { quickPicks: [], inputBoxes: [], messages: [] };
const state = { workspaceFolders: [], configuration: {} };

const disposable = () => ({ dispose: () => {} });
const eventRegistrar = name => handler => {
  (recorded.eventHandlers[name] ??= []).push(handler);
  return disposable();
};
const nextMessageAnswer = () => scriptedAnswers.messages.shift();

const vscode = {
  EventEmitter,
  TreeItem,
  ThemeIcon,
  ThemeColor,
  MarkdownString,
  TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
  StatusBarAlignment: { Left: 1, Right: 2 },
  TerminalLocation: { Panel: 1, Editor: 2 },
  Uri: { file: fsPath => ({ fsPath, scheme: 'file' }), parse: value => ({ value, scheme: 'https' }) },
  env: { appName: 'Visual Studio Code', appRoot: '/nonexistent-app-root', openExternal: async () => true },
  window: {
    activeTextEditor: undefined,
    createOutputChannel: () => ({ appendLine: () => {}, show: () => {}, dispose: () => {} }),
    createTreeView: (id, options) => {
      const treeView = { id, ...options, dispose: () => {} };
      recorded.treeViews.push(treeView);
      return treeView;
    },
    createStatusBarItem: () => {
      const item = { text: '', visible: false, show() { this.visible = true; }, hide() { this.visible = false; }, dispose() {} };
      recorded.statusBarItems.push(item);
      return item;
    },
    createTerminal: options => {
      const terminal = { options, shown: false, show() { this.shown = true; }, dispose() {} };
      recorded.terminals.push(terminal);
      return terminal;
    },
    showInformationMessage: async (message, ...items) => {
      recorded.informationMessages.push({ message, items });
      return nextMessageAnswer();
    },
    showWarningMessage: async (message, ...items) => {
      recorded.warningMessages.push({ message, items });
      return nextMessageAnswer();
    },
    showErrorMessage: async message => {
      recorded.errorMessages.push(message);
      return undefined;
    },
    showQuickPick: async (items, options) => {
      const answer = scriptedAnswers.quickPicks.shift();
      return typeof answer === 'function' ? answer(await items, options) : answer;
    },
    showInputBox: async options => {
      const answer = scriptedAnswers.inputBoxes.shift();
      if (answer !== undefined && options?.validateInput) {
        const validationError = options.validateInput(answer);
        if (validationError) throw new Error(`fake input '${answer}' failed validation: ${validationError}`);
      }
      return answer;
    },
    showOpenDialog: async () => undefined,
    showTextDocument: async () => undefined,
    setStatusBarMessage: () => disposable(),
    onDidChangeActiveTextEditor: eventRegistrar('activeTextEditor'),
    onDidChangeWindowState: eventRegistrar('windowState'),
    onDidCloseTerminal: eventRegistrar('closeTerminal'),
  },
  workspace: {
    get workspaceFolders() {
      return state.workspaceFolders.map(fsPath => ({ uri: { fsPath } }));
    },
    getWorkspaceFolder: () => undefined,
    getConfiguration: () => ({ get: (key, defaultValue) => state.configuration[key] ?? defaultValue }),
    openTextDocument: async uri => ({ uri }),
    onDidSaveTextDocument: eventRegistrar('saveTextDocument'),
    onDidChangeConfiguration: eventRegistrar('changeConfiguration'),
    onDidChangeWorkspaceFolders: eventRegistrar('changeWorkspaceFolders'),
  },
  commands: {
    registerCommand: (commandId, handler) => {
      recorded.commands.set(commandId, handler);
      return disposable();
    },
    executeCommand: async (commandId, ...args) => recorded.commands.get(commandId)?.(...args),
  },
};

function resetFakeVsCode({ workspaceFolders = [], configuration = {} } = {}) {
  for (const value of Object.values(recorded)) {
    if (value instanceof Map) value.clear();
    else if (Array.isArray(value)) value.length = 0;
  }
  recorded.eventHandlers = {};
  scriptedAnswers.quickPicks.length = 0;
  scriptedAnswers.inputBoxes.length = 0;
  scriptedAnswers.messages.length = 0;
  state.workspaceFolders = workspaceFolders;
  state.configuration = configuration;
}

module.exports = { ...vscode, fake: { recorded, scriptedAnswers, state, reset: resetFakeVsCode } };
