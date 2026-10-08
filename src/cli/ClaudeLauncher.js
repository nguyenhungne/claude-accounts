import { CctError } from '../core/errors/CctError.js';
import { normalizeFolderPath } from '../core/fileSystem/FileSystem.js';
import { requireExecutable } from '../core/platform/ExecutableLocator.js';
import { blankToNull } from '../core/text/Text.js';
import { chooseFromMenu, confirm, MENU_CANCELLED } from './output/InteractivePrompt.js';

export class ClaudeLauncher {
  constructor({ services, terminal, session }) {
    this.services = services;
    this.terminal = terminal;
    this.session = session;
  }

  async launch(profile, claudeArguments, reason = '') {
    const claudeExecutable = requireExecutable('claude');
    const account = this.services.accounts.claudeAccount(profile) ?? 'not logged in';
    this.terminal.highlight(`cct: claude as '${profile.name}' (${account}${reason ? `, ${reason}` : ''})`);
    return this.session.run(profile, claudeExecutable, claudeArguments);
  }

  async launchForCurrentFolder(claudeArguments) {
    const resolution = this.services.resolver.resolve(process.cwd());
    if (resolution) {
      return this.launch(this.services.profiles.get(resolution.profileName), claudeArguments, resolution.reason);
    }
    return this.chooseAndLaunch(claudeArguments);
  }

  async chooseAndLaunch(claudeArguments) {
    const profiles = this.services.profiles.list();
    if (profiles.length === 1) {
      this.terminal.info(this.terminal.colors.dim("cct: only the default profile exists, create another with 'cct add <name>'"));
      return this.launch(profiles[0], claudeArguments);
    }
    if (!this.terminal.isInteractive) throw new CctError('no profile is bound to this folder; run: cct <profile>');

    const selectedIndex = await chooseFromMenu(this.terminal, {
      title: this.terminal.colors.dim('Choose a profile (arrows or number, Enter to start, Esc to cancel)'),
      options: this.#menuOptions(profiles),
    });
    if (selectedIndex === MENU_CANCELLED) return 0;

    const profile = profiles[selectedIndex];
    const currentFolder = normalizeFolderPath(process.cwd());
    if (await confirm(this.terminal, `Always use '${profile.name}' under ${currentFolder}?`)) {
      this.services.bindings.bind(currentFolder, profile.name);
      this.terminal.success(`cct: ${currentFolder} -> ${profile.name}`);
    }
    return this.launch(profile, claudeArguments);
  }

  #menuOptions(profiles) {
    const nameWidth = Math.max(...profiles.map(profile => profile.name.length));
    return profiles.map((profile, index) => {
      const account = this.services.accounts.claudeAccount(profile) ?? 'not logged in';
      const description = blankToNull(profile.description);
      const suffix = description ? this.terminal.colors.dim(`  ${description}`) : '';
      return `${index + 1}) ${profile.name.padEnd(nameWidth)}  ${account}${suffix}`;
    });
  }
}
