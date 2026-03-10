# Contributing to NoteGenius AI

Thank you for your interest in contributing! This document outlines the process for contributing to the project.

## Getting Started

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Notegenious_ai.git
   cd Notegenious_ai
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/Devapriyan-S/Notegenious_ai.git
   ```

### Set Up Development Environment

```bash
npm install
npm run dev
```

Open [http://localhost:3000/Notegenious_ai](http://localhost:3000/Notegenious_ai) in your browser.

## Development Workflow

### Create a Branch

```bash
git checkout -b feat/my-new-feature
# or
git checkout -b fix/bug-description
```

### Branch Naming

- `feat/description` — new features
- `fix/description` — bug fixes
- `docs/description` — documentation
- `refactor/description` — code refactoring
- `test/description` — adding tests

### Make Your Changes

1. Write clean, typed TypeScript
2. Follow the existing code style
3. Add tests for new functionality
4. Ensure all tests pass: `npm run test`
5. Ensure linting passes: `npm run lint`
6. Ensure formatting is correct: `npm run format:check`
7. Ensure type-checking passes: `npm run type-check`
8. Ensure the build succeeds: `npm run build`

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description

feat(ai): add GPT-4 model support
fix(editor): prevent crash when note is empty
docs(readme): update deployment instructions
refactor(sidebar): extract note list into component
test(utils): add tests for sanitizeFilename
chore(deps): update framer-motion to v12
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### Submit a Pull Request

1. Push your branch:
   ```bash
   git push origin feat/my-new-feature
   ```
2. Open a Pull Request on GitHub
3. Fill in the PR template
4. Wait for CI checks to pass
5. Request a review

## Code Style

- TypeScript strict mode
- Prettier for formatting (`.prettierrc`)
- ESLint for linting (`.eslintrc.json`)
- Use `'use client'` directive for client components
- Prefer `const` over `let`
- Use descriptive variable names

## Reporting Issues

Use the GitHub issue templates:
- **Bug Report** — for bugs and unexpected behavior
- **Feature Request** — for new features and improvements

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
