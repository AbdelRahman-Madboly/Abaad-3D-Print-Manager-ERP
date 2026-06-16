# Contributing to Abaad ERP

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production releases only — tagged vX.Y.Z, never commit directly |
| `develop` | Integration branch — all work lands here via PR |
| `feature/*` | New features and phases, off `develop` |
| `fix/*` | Bug fixes, off `develop` |
| `chore/*` | Tooling, CI, deps — no app logic |
| `docs/*` | Documentation only |

## Day-to-day workflow

```bash
# 1. Start from latest develop
git checkout develop && git pull

# 2. Create your branch
git checkout -b feature/short-description

# 3. Work, commit often
git add -A
git commit -m "feat(scope): what changed"

# 4. Push and open PR
git push -u origin feature/short-description
gh pr create --base develop --fill

# 5. CI must pass — check GitHub Actions tab
# 6. Merge after CI passes
gh pr merge --merge --delete-branch

# 7. Back to develop for next task
git checkout develop && git pull
```

## Releasing a version

```bash
git checkout main
git merge develop
git push origin main

# Tag the release
git tag -a v5.1.0 -m "Brief description of what's in this release"
git push origin v5.1.0

# Update CHANGELOG.md: move [Unreleased] items under the new version
```

## Commit message format (Conventional Commits)

```
feat(scope):     new capability
fix(scope):      bug fix
refactor(scope): restructure, no behavior change
test(scope):     add or update tests
docs:            documentation only
chore:           tooling, deps, config — no source logic
remove:          delete dead code or files
```

`scope` = the area affected: `config`, `database`, `order`, `pdf`, `ui`,
`dashboard`, `auth`, `wizard`, `launcher`, `ci`, etc.

## Running tests locally

```bash
pytest -q                  # all tests
pytest tests/test_X.py -v  # one file
DISPLAY="" pytest -q       # simulate CI headless environment
```

## Branch protection (set in GitHub repo settings)

- `main`: require PR, require CI pass, no direct push
- `develop`: require CI pass

## Architecture rules

See `docs/CLAUDE.md` — never violate these.
