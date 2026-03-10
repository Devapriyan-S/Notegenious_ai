# Tester — CI/CD and Railway Deployment Setup

## Verification Strategy
This task creates/modifies config files, workflow YAML files, and documentation. All tests are structural and content checks — no compilation required.

---

## Check 1: railway.toml exists at root
```bash
test -f /home/kniti/Documents/new/Notegenious_ai/railway.toml && echo "RAILWAY_TOML_OK"
```
Must print RAILWAY_TOML_OK.

## Check 2: railway.toml contains both service definitions
```bash
grep -q "backend" /home/kniti/Documents/new/Notegenious_ai/railway.toml && \
grep -q "frontend" /home/kniti/Documents/new/Notegenious_ai/railway.toml && \
grep -q "uvicorn" /home/kniti/Documents/new/Notegenious_ai/railway.toml && \
grep -q "\$PORT" /home/kniti/Documents/new/Notegenious_ai/railway.toml && \
echo "RAILWAY_CONTENT_OK"
```
Must print RAILWAY_CONTENT_OK.

## Check 3: next.config.js supports RAILWAY env var
```bash
grep -q "RAILWAY" /home/kniti/Documents/new/Notegenious_ai/frontend/next.config.js && \
grep -q "output.*export" /home/kniti/Documents/new/Notegenious_ai/frontend/next.config.js && \
echo "NEXT_CONFIG_OK"
```
Must print NEXT_CONFIG_OK. (Must still contain output:export for GitHub Pages AND RAILWAY check for server mode.)

## Check 4: ci.yml has backend job
```bash
grep -q "backend" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/ci.yml && \
grep -q "setup-python" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/ci.yml && \
grep -q "pip install" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/ci.yml && \
grep -q "py_compile" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/ci.yml && \
echo "CI_BACKEND_OK"
```
Must print CI_BACKEND_OK.

## Check 5: ci.yml still has frontend job
```bash
grep -q "working-directory: frontend" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/ci.yml && \
grep -q "npm ci" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/ci.yml && \
grep -q "npm run lint" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/ci.yml && \
echo "CI_FRONTEND_OK"
```
Must print CI_FRONTEND_OK.

## Check 6: deploy.yml uses Railway (not GitHub Pages)
```bash
grep -q "RAILWAY_TOKEN" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/deploy.yml && \
grep -qi "railway" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/deploy.yml && \
echo "DEPLOY_RAILWAY_OK"
```
Must print DEPLOY_RAILWAY_OK.

## Check 7: deploy.yml does NOT deploy to GitHub Pages
```bash
grep -qv "deploy-pages" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/deploy.yml && \
echo "DEPLOY_NO_PAGES_OK"
```
Must print DEPLOY_NO_PAGES_OK.

## Check 8: pr-check.yml has branch name convention check
```bash
grep -q "feature/" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/pr-check.yml && \
grep -q "bug/" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/pr-check.yml && \
grep -q "release/" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/pr-check.yml && \
echo "PRCHECK_BRANCH_OK"
```
Must print PRCHECK_BRANCH_OK.

## Check 9: pr-check.yml has commit/PR title convention check
```bash
grep -qi "feat\|feature\|fix\|bug\|release" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/pr-check.yml && \
echo "PRCHECK_COMMIT_OK"
```
Must print PRCHECK_COMMIT_OK.

## Check 10: release.yml still references docs/cliff.toml
```bash
grep -q "docs/cliff.toml" /home/kniti/Documents/new/Notegenious_ai/.github/workflows/release.yml && \
echo "RELEASE_CLIFFTOML_OK"
```
Must print RELEASE_CLIFFTOML_OK.

## Check 11: docs/cliff.toml has bug/feature/release parsers
```bash
grep -qi "bug" /home/kniti/Documents/new/Notegenious_ai/docs/cliff.toml && \
grep -qi "feature" /home/kniti/Documents/new/Notegenious_ai/docs/cliff.toml && \
grep -qi "release" /home/kniti/Documents/new/Notegenious_ai/docs/cliff.toml && \
echo "CLIFF_TOML_OK"
```
Must print CLIFF_TOML_OK.

## Check 12: PULL_REQUEST_TEMPLATE.md has backend + convention items
```bash
grep -qi "backend\|pytest\|pip" /home/kniti/Documents/new/Notegenious_ai/.github/PULL_REQUEST_TEMPLATE.md && \
grep -qi "branch\|feature/\|bug/\|release/" /home/kniti/Documents/new/Notegenious_ai/.github/PULL_REQUEST_TEMPLATE.md && \
echo "PR_TEMPLATE_OK"
```
Must print PR_TEMPLATE_OK.

## Check 13: .github/CONTRIBUTING.md exists
```bash
test -f /home/kniti/Documents/new/Notegenious_ai/.github/CONTRIBUTING.md && echo "GITHUB_CONTRIBUTING_OK"
```
Must print GITHUB_CONTRIBUTING_OK.

## Check 14: .github/CONTRIBUTING.md has branch naming and versioning info
```bash
grep -qi "feature/\|bug/\|release/" /home/kniti/Documents/new/Notegenious_ai/.github/CONTRIBUTING.md && \
grep -qi "semantic\|versioning\|semver\|patch\|minor\|major" /home/kniti/Documents/new/Notegenious_ai/.github/CONTRIBUTING.md && \
echo "CONTRIBUTING_CONTENT_OK"
```
Must print CONTRIBUTING_CONTENT_OK.

## Check 15: README.md exists at project root
```bash
test -f /home/kniti/Documents/new/Notegenious_ai/README.md && echo "ROOT_README_OK"
```
Must print ROOT_README_OK.

## Check 16: README.md has all required sections
```bash
grep -qi "tech stack\|technology" /home/kniti/Documents/new/Notegenious_ai/README.md && \
grep -qi "environment variable" /home/kniti/Documents/new/Notegenious_ai/README.md && \
grep -qi "railway" /home/kniti/Documents/new/Notegenious_ai/README.md && \
grep -qi "branch\|versioning" /home/kniti/Documents/new/Notegenious_ai/README.md && \
grep -qi "local development\|quick start\|getting started" /home/kniti/Documents/new/Notegenious_ai/README.md && \
echo "README_SECTIONS_OK"
```
Must print README_SECTIONS_OK.

## Check 17: docs/RAILWAY_SETUP.md exists
```bash
test -f /home/kniti/Documents/new/Notegenious_ai/docs/RAILWAY_SETUP.md && echo "RAILWAY_SETUP_DOC_OK"
```
Must print RAILWAY_SETUP_DOC_OK.

## Check 18: docs/RAILWAY_SETUP.md has env vars documented
```bash
grep -qi "DATABASE_URL\|SECRET_KEY\|MAILERSEND" /home/kniti/Documents/new/Notegenious_ai/docs/RAILWAY_SETUP.md && \
grep -qi "NEXT_PUBLIC_API_URL\|RAILWAY" /home/kniti/Documents/new/Notegenious_ai/docs/RAILWAY_SETUP.md && \
echo "RAILWAY_SETUP_CONTENT_OK"
```
Must print RAILWAY_SETUP_CONTENT_OK.

## Check 19: backend/ files still intact (no accidental changes)
```bash
test -f /home/kniti/Documents/new/Notegenious_ai/backend/main.py && \
test -f /home/kniti/Documents/new/Notegenious_ai/backend/auth.py && \
test -f /home/kniti/Documents/new/Notegenious_ai/backend/requirements.txt && \
echo "BACKEND_INTACT_OK"
```
Must print BACKEND_INTACT_OK.

## Check 20: YAML syntax check on all modified workflows
```bash
python3 -c "
import yaml, sys
files = [
    '/home/kniti/Documents/new/Notegenious_ai/.github/workflows/ci.yml',
    '/home/kniti/Documents/new/Notegenious_ai/.github/workflows/deploy.yml',
    '/home/kniti/Documents/new/Notegenious_ai/.github/workflows/pr-check.yml',
    '/home/kniti/Documents/new/Notegenious_ai/.github/workflows/release.yml',
]
for f in files:
    try:
        yaml.safe_load(open(f))
        print(f'OK: {f}')
    except Exception as e:
        print(f'FAIL: {f}: {e}')
        sys.exit(1)
print('YAML_SYNTAX_OK')
"
```
Must print YAML_SYNTAX_OK.

---

## Pass Criteria
All 20 checks must pass (print their expected OK string). The YAML syntax check is critical — any malformed workflow file will cause GitHub Actions to fail silently.
