# Contributing to Atlas-ERP

Thank you for considering contributing to Atlas-ERP! This document outlines the process for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in the [Issues](https://github.com/KB01111/Atlas-erp-clean/issues)
- Use the bug report template to create a new issue
- Include detailed steps to reproduce the bug
- Include screenshots if applicable
- Specify your environment (OS, browser, etc.)

### Suggesting Features

- Check if the feature has already been suggested in the [Issues](https://github.com/KB01111/Atlas-erp-clean/issues)
- Use the feature request template to create a new issue
- Provide a clear description of the feature
- Explain why this feature would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 20 or higher
- pnpm 8 or higher
- Docker and Docker Compose (for running the full stack)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/KB01111/Atlas-erp-clean.git
   cd Atlas-erp-clean
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```

4. Start the development server
   ```bash
   pnpm dev
   ```

### Docker Development

To run the full stack with Docker:

```bash
./scripts/build-and-run.sh
```

## Coding Guidelines

- Follow the existing code style
- Write meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
- Add tests for new features
- Update documentation as needed

## Branch Naming Convention

- `feature/` - New features
- `bugfix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

## License

By contributing to Atlas-ERP, you agree that your contributions will be licensed under the project's license.
