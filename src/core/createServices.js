import { AccountInspector } from './accounts/AccountInspector.js';
import { ProfileOverviewService } from './accounts/ProfileOverviewService.js';
import { FolderBindingRepository } from './bindings/FolderBindingRepository.js';
import { ActiveShellRule, FolderBindingRule, ProfileResolver } from './bindings/ProfileResolver.js';
import { AppPaths } from './config/AppPaths.js';
import { EditorWindowLauncher } from './editors/EditorWindowLauncher.js';
import { EnvironmentBaseline } from './environment/EnvironmentBaseline.js';
import { ProfileEnvironmentBuilder } from './environment/ProfileEnvironmentBuilder.js';
import { LoginPlanner } from './login/LoginPlanner.js';
import { McpConnectionInspector } from './mcp/McpConnectionInspector.js';
import { McpServerInstaller } from './mcp/McpServerInstaller.js';
import { ProfileDirectories } from './profiles/ProfileDirectories.js';
import { ProfileLifecycle } from './profiles/ProfileLifecycle.js';
import { ProfileRepository } from './profiles/ProfileRepository.js';
import { ClaudeItemLinker } from './sharing/ClaudeItemLinker.js';
import { McpConfigurationSynchronizer } from './sharing/McpConfigurationSynchronizer.js';
import { ProfileSynchronizer } from './sharing/ProfileSynchronizer.js';
import { SettingsEnvironmentWriter } from './sharing/SettingsEnvironmentWriter.js';
import { ShellIntegrationInstaller } from './shell/ShellIntegrationInstaller.js';
import { GitConfigWriter } from './tools/GitConfigWriter.js';
import { ToolTokenStore } from './tools/ToolTokenStore.js';

export function createServices({ environment = process.env } = {}) {
  const appPaths = AppPaths.fromEnvironment(environment);
  const environmentBaseline = new EnvironmentBaseline(environment);
  const profiles = new ProfileRepository(appPaths);
  const bindings = new FolderBindingRepository(appPaths);
  const directories = new ProfileDirectories(appPaths, environmentBaseline);
  const environmentBuilder = new ProfileEnvironmentBuilder(directories, environmentBaseline, environment);
  const linker = new ClaudeItemLinker(directories, appPaths);
  const accounts = new AccountInspector(directories);
  const toolTokens = new ToolTokenStore(directories);
  const synchronizer = new ProfileSynchronizer({
    directories,
    environmentBuilder,
    linker,
    mcpSynchronizer: new McpConfigurationSynchronizer(directories),
    settingsWriter: new SettingsEnvironmentWriter(directories),
    gitConfigWriter: new GitConfigWriter(directories),
  });
  const resolver = new ProfileResolver([
    new ActiveShellRule(environmentBaseline, profiles),
    new FolderBindingRule(bindings, profiles),
  ]);

  return {
    appPaths,
    environmentBaseline,
    profiles,
    bindings,
    directories,
    environmentBuilder,
    linker,
    synchronizer,
    resolver,
    accounts,
    lifecycle: new ProfileLifecycle({ profiles, bindings, linker, synchronizer }),
    loginPlanner: new LoginPlanner(),
    editorWindows: new EditorWindowLauncher({ directories, environmentBuilder }),
    mcpConnections: new McpConnectionInspector(directories),
    mcpInstaller: new McpServerInstaller({ environmentBuilder }),
    toolTokens,
    overview: new ProfileOverviewService({ profiles, bindings, accounts, environmentBaseline, toolTokens }),
    shellIntegration: new ShellIntegrationInstaller(),
  };
}
