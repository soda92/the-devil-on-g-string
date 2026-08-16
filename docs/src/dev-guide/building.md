# Build & Deployment Pipeline

---

## 🏗️ Development & Production Builds

```bash
# Start local development server
pnpm dev

# Typecheck TypeScript files
npx tsc --noEmit

# Run ESLint linter
pnpm lint

# Build production bundle
pnpm build
```

---

## 📚 Building mdBook Documentation

```bash
# Build static book HTML into docs/book/
mdbook build docs

# Serve documentation locally on http://localhost:3000
mdbook serve docs
```
