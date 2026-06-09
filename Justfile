# chatta Justfile
set shell := ["bash", "-cu"]

default:
    @just --list

install:
    npm install

build:
    npm run build

test:
    npm test

lint:
    npx eslint . --ext .ts
    npx prettier --check "**/*.ts"

fmt:
    npx prettier --write "**/*.ts"

ci: install build test lint

clean:
    rm -rf node_modules dist
# Grade targets (strictest checks — no caching)
grade:
    @echo "=== Running full grade ==="
    ./grade.sh

grade-fast:
    @echo "=== Running fast grade ==="
    ./grade.sh --fast

grade-json:
    @echo "=== Running grade (JSON) ==="
    ./grade.sh --json

grade-html:
    @echo "=== Running grade (HTML) ==="
    ./grade.sh --html

