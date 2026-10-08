const ANSI_CODES = Object.freeze({ red: 31, green: 32, yellow: 33, cyan: 36, dim: 2 });

function createPalette(colorEnabled) {
  const palette = {};
  for (const [colorName, code] of Object.entries(ANSI_CODES)) {
    palette[colorName] = text => (colorEnabled ? `\x1b[${code}m${text}\x1b[0m` : String(text));
  }
  return Object.freeze(palette);
}

export class Terminal {
  constructor({ output = process.stdout, diagnostics = process.stderr, input = process.stdin, environment = process.env } = {}) {
    this.output = output;
    this.diagnostics = diagnostics;
    this.input = input;
    this.colors = createPalette(Boolean(diagnostics.isTTY) && !environment.NO_COLOR);
  }

  get isInteractive() {
    return Boolean(this.input.isTTY && this.diagnostics.isTTY);
  }

  print(text = '') {
    this.output.write(`${text}\n`);
  }

  info(text = '') {
    this.diagnostics.write(`${text}\n`);
  }

  highlight(text) {
    this.info(this.colors.cyan(text));
  }

  success(text) {
    this.info(this.colors.green(text));
  }

  warn(text) {
    this.info(this.colors.yellow(text));
  }

  error(text) {
    this.info(this.colors.red(text));
  }
}
