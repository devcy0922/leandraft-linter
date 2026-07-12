# LeanDraft-Linter

LeanDraft-Linter is an architecture complexity analyzer and linter. It evaluates project design specifications, markdown PR plans, and codebase summaries to flag structural over-engineering and suggests minimal viable alternatives.

## Features

- **Complexity Scoring**: Rates design over-engineering on a numeric scale.
- **Structural Anomaly Detection**: Highlights over-scoped system components (e.g. compilers, workflows, queues) where simple procedural logic is sufficient.
- **Web UI & CLI**: Run static scans via command line or launch an Express-backed local Vue 3 dashboard.

## Usage

### Command Line (CLI)
```bash
# Analyze target design specification
leandraft-lint check examples/simple-crud-plan.md

# Output results in JSON format
leandraft-lint check examples/simple-crud-plan.md --format json
```

### Local Web UI
```bash
# Launch server and open browser
leandraft-lint ui --port 3000
```

## Tech Stack

- **CLI Engine**: Commander.js & Biome
- **Web App**: Vue 3, Vite, Express, TypeScript
- **Bundler**: tsup
