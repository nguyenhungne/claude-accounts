class WorkspaceFolders {
  constructor(vscode) {
    this.vscode = vscode;
  }

  all() {
    return (this.vscode.workspace.workspaceFolders ?? []).map(folder => folder.uri.fsPath);
  }

  current() {
    const activeDocument = this.vscode.window.activeTextEditor?.document;
    const activeFolder = activeDocument ? this.vscode.workspace.getWorkspaceFolder(activeDocument.uri) : undefined;
    return activeFolder?.uri.fsPath ?? this.all()[0] ?? null;
  }
}

module.exports = { WorkspaceFolders };
