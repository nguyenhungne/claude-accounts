export class CommandRegistry {
  constructor() {
    this.commands = [];
  }

  register(command) {
    this.commands.push(command);
    return this;
  }

  find(name) {
    const lookupName = String(name).toLowerCase();
    return this.commands.find(command => command.names.includes(lookupName)) ?? null;
  }

  groupedBySection() {
    const groups = new Map();
    for (const command of this.commands) {
      if (!groups.has(command.section)) groups.set(command.section, []);
      groups.get(command.section).push(command);
    }
    return groups;
  }
}
