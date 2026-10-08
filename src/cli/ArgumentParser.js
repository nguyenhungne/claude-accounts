import { CctError } from '../core/errors/CctError.js';

const OPTION_PATTERN = /^--?([a-zA-Z][\w-]*)(?:=(.*))?$/;

export function parseArguments(args, { flags = [], aliases = {} } = {}) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const match = OPTION_PATTERN.exec(args[index]);
    if (!match) {
      positionals.push(args[index]);
      continue;
    }
    const rawName = match[1].toLowerCase();
    const optionName = aliases[rawName] ?? rawName;
    const inlineValue = match[2];
    if (inlineValue !== undefined) options[optionName] = inlineValue;
    else if (flags.includes(optionName)) options[optionName] = true;
    else if (index + 1 < args.length) options[optionName] = args[++index];
    else throw new CctError(`missing value for --${optionName}`);
  }
  return { positionals, options };
}

export function requireProfileName(positionals) {
  const [profileName] = positionals;
  if (!profileName) throw new CctError('profile name required (see: cct list)');
  return String(profileName).toLowerCase();
}
