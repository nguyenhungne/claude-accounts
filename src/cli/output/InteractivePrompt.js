import readline from 'node:readline';

const CANCELLED = -1;

export function askQuestion(terminal, question) {
  return new Promise(resolve => {
    const prompt = readline.createInterface({ input: terminal.input, output: terminal.diagnostics });
    prompt.question(question, answer => {
      prompt.close();
      resolve(answer.trim());
    });
  });
}

export async function confirm(terminal, question) {
  return /^y(es)?$/i.test(await askQuestion(terminal, `${question} [y/N] `));
}

export function chooseFromMenu(terminal, { title, options }) {
  return new Promise(resolve => {
    let selectedIndex = 0;
    const { input, diagnostics, colors } = terminal;

    const render = isFirstRender => {
      if (!isFirstRender) diagnostics.write(`\x1b[${options.length}A`);
      options.forEach((option, index) => {
        const line = index === selectedIndex ? colors.cyan(`> ${option}`) : `  ${option}`;
        diagnostics.write(`\x1b[2K${line}\n`);
      });
    };

    const finish = result => {
      input.off('keypress', handleKeypress);
      input.setRawMode(false);
      input.pause();
      resolve(result);
    };

    const handleKeypress = (character, key = {}) => {
      if (key.name === 'up' || key.name === 'k') selectedIndex = (selectedIndex - 1 + options.length) % options.length;
      else if (key.name === 'down' || key.name === 'j') selectedIndex = (selectedIndex + 1) % options.length;
      else if (/^[1-9]$/.test(character ?? '') && Number(character) <= options.length) {
        selectedIndex = Number(character) - 1;
        render(false);
        return finish(selectedIndex);
      } else if (key.name === 'return' || key.name === 'enter') return finish(selectedIndex);
      else if (key.name === 'escape' || key.name === 'q' || (key.ctrl && key.name === 'c')) return finish(CANCELLED);
      render(false);
    };

    terminal.info(title);
    render(true);
    readline.emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    input.on('keypress', handleKeypress);
  });
}

export const MENU_CANCELLED = CANCELLED;
