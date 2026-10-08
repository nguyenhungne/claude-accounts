const { AddProfileCommand } = require('./AddProfileCommand');
const { BindWorkspaceFolderCommand } = require('./BindWorkspaceFolderCommand');
const { ChooseSeparateToolsCommand } = require('./ChooseSeparateToolsCommand');
const { ConnectServiceCommand } = require('./ConnectServiceCommand');
const { EditProfileCommand } = require('./EditProfileCommand');
const { LaunchClaudeCommand } = require('./LaunchClaudeCommand');
const { LaunchClaudeForWorkspaceCommand } = require('./LaunchClaudeForWorkspaceCommand');
const { LoginCommand } = require('./LoginCommand');
const { MakeToolSeparateCommand } = require('./MakeToolSeparateCommand');
const { OpenProfileTerminalCommand } = require('./OpenProfileTerminalCommand');
const { OpenWindowAsProfileCommand } = require('./OpenWindowAsProfileCommand');
const { RefreshCommand } = require('./RefreshCommand');
const { RemoveProfileCommand } = require('./RemoveProfileCommand');
const { RevealProfileFolderCommand } = require('./RevealProfileFolderCommand');
const { ShareToolCommand } = require('./ShareToolCommand');
const { UnbindFolderCommand } = require('./UnbindFolderCommand');

const COMMAND_TYPES = [
  LaunchClaudeForWorkspaceCommand,
  LaunchClaudeCommand,
  OpenProfileTerminalCommand,
  OpenWindowAsProfileCommand,
  LoginCommand,
  ConnectServiceCommand,
  ChooseSeparateToolsCommand,
  MakeToolSeparateCommand,
  ShareToolCommand,
  AddProfileCommand,
  EditProfileCommand,
  RemoveProfileCommand,
  BindWorkspaceFolderCommand,
  UnbindFolderCommand,
  RevealProfileFolderCommand,
  RefreshCommand,
];

function registerCommands(extension) {
  return COMMAND_TYPES.map(CommandType => new CommandType(extension).register());
}

module.exports = { registerCommands };
