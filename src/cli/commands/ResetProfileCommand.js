import { CommandSection } from '../Command.js';
import { UseProfileCommand } from './UseProfileCommand.js';

export class ResetProfileCommand extends UseProfileCommand {
  constructor(context) {
    super(context, {
      names: ['reset'],
      section: CommandSection.OTHER_TOOLS,
      usage: 'cct reset',
      summary: 'switch the current shell back to the default profile',
    });
  }

  assignmentsFor() {
    return this.services.environmentBuilder.resetAssignments();
  }

  confirmationMessage() {
    return 'cct: this shell is back to the default profile';
  }
}
