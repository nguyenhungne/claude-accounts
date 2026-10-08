const path = require('node:path');

class WorkspaceFolderPicker {
  constructor(extension) {
    this.extension = extension;
  }

  async pick({ placeHolder }) {
    const { vscode, workspaceFolders } = this.extension;
    const folders = workspaceFolders.all();
    if (folders.length === 1) return folders[0];
    if (folders.length === 0) {
      const [selected] = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Folder',
      }) ?? [];
      return selected?.fsPath ?? null;
    }
    const current = workspaceFolders.current();
    const items = [...folders]
      .sort((first, second) => Number(second === current) - Number(first === current))
      .map(folder => ({ label: `$(folder) ${path.basename(folder)}`, description: folder, folder }));
    const selected = await vscode.window.showQuickPick(items, { placeHolder });
    return selected?.folder ?? null;
  }
}

module.exports = { WorkspaceFolderPicker };
