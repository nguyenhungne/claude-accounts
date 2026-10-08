import { CommandRegistry } from './CommandRegistry.js';
import { AddProfileCommand } from './commands/AddProfileCommand.js';
import { BindFolderCommand } from './commands/BindFolderCommand.js';
import { EditProfileCommand } from './commands/EditProfileCommand.js';
import { ExecCommand } from './commands/ExecCommand.js';
import { HelpCommand } from './commands/HelpCommand.js';
import { InstallShellIntegrationCommand } from './commands/InstallShellIntegrationCommand.js';
import { ListBindingsCommand } from './commands/ListBindingsCommand.js';
import { ListProfilesCommand } from './commands/ListProfilesCommand.js';
import { LoginCommand } from './commands/LoginCommand.js';
import { OpenEditorWindowCommand } from './commands/OpenEditorWindowCommand.js';
import { OpenShellCommand } from './commands/OpenShellCommand.js';
import { PickProfileCommand } from './commands/PickProfileCommand.js';
import { PrintEnvironmentCommand } from './commands/PrintEnvironmentCommand.js';
import { PrintShellIntegrationCommand } from './commands/PrintShellIntegrationCommand.js';
import { RemoveProfileCommand } from './commands/RemoveProfileCommand.js';
import { ResetProfileCommand } from './commands/ResetProfileCommand.js';
import { RunClaudeCommand } from './commands/RunClaudeCommand.js';
import { ShowProfileCommand } from './commands/ShowProfileCommand.js';
import { SyncProfilesCommand } from './commands/SyncProfilesCommand.js';
import { UnbindFolderCommand } from './commands/UnbindFolderCommand.js';
import { UninstallShellIntegrationCommand } from './commands/UninstallShellIntegrationCommand.js';
import { UseProfileCommand } from './commands/UseProfileCommand.js';
import { VersionCommand } from './commands/VersionCommand.js';
import { WhichProfileCommand } from './commands/WhichProfileCommand.js';

const COMMAND_TYPES = [
  RunClaudeCommand,
  PickProfileCommand,
  ListProfilesCommand,
  ShowProfileCommand,
  AddProfileCommand,
  LoginCommand,
  EditProfileCommand,
  SyncProfilesCommand,
  RemoveProfileCommand,
  BindFolderCommand,
  UnbindFolderCommand,
  ListBindingsCommand,
  WhichProfileCommand,
  ExecCommand,
  OpenShellCommand,
  UseProfileCommand,
  ResetProfileCommand,
  PrintEnvironmentCommand,
  OpenEditorWindowCommand,
  InstallShellIntegrationCommand,
  UninstallShellIntegrationCommand,
  PrintShellIntegrationCommand,
  HelpCommand,
  VersionCommand,
];

export function createCommandRegistry(context) {
  const registry = new CommandRegistry();
  context.registry = registry;
  for (const CommandType of COMMAND_TYPES) registry.register(new CommandType(context));
  return registry;
}
