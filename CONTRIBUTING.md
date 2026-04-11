# Contributing to huddy

Thanks for your interest in contributing!

## Getting Started

```bash
git clone https://github.com/7apislaz/huddy.git
cd huddy
npm install
npm run build
npm link
```

## Development

```bash
npm run dev      # TypeScript watch mode
npm test         # Run tests
npm run test:watch  # Watch mode
```

## Submitting Changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `npm run build` and `npm test` pass
4. Open a pull request

## Adding a New Character

Characters live in `src/characters/`. Each file exports a `CharacterDef` with frames for each emotion (`idle`, `happy`, `sad`, `tired`). Copy an existing character as a template.

Don't forget to register it in `src/characters/index.ts`.

## Reporting Bugs

Open an issue with the bug report template. Include your Node.js version and OS.

## License

By contributing, you agree your changes will be licensed under the [MIT License](LICENSE).
