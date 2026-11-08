# Deploying the frontend

The frontend is a static Vite build hosted on Vercel. Deploy the backend
first: the frontend sends player credential headers that the backend's CORS
settings must allow.

## Vercel setup

1. Import `puffLive/cashflow-calculator-frontend` in Vercel. `vercel.json`
   sets the framework (Vite), install and build commands, the `dist` output
   folder, and a rewrite that serves `index.html` for every path, so deep
   links like `/game/ABC123/dashboard` load instead of returning 404.
2. In Project Settings > Environment Variables, set for Production (and
   Preview, if you use preview deployments):
   - `VITE_API_BASE_URL` = `https://<your-backend>.up.railway.app/api`
   - `VITE_SOCKET_URL` = `https://<your-backend>.up.railway.app`

   The production build fails with a clear message if either is missing or
   not an absolute http(s) URL, rather than shipping a bundle that talks to
   localhost.
3. On the backend (Railway), set `CORS_ORIGIN` to the Vercel URL. It takes a
   comma-separated list if you also use a custom domain or preview URLs.

## Shared calculation code

`@cashflow/shared` (types and the calculation engine) lives in the backend
repo. A built copy is committed here in `vendor/cashflow-shared`, so this
repo builds on its own with no access to the backend. `SOURCE.json` in that
folder records the backend commit it came from.

When the backend's `shared/` code changes, refresh the copy:

```bash
npm run sync:shared                         # finds ../cashflow-backend or ../cash-flow-backend
npm run sync:shared -- /path/to/cashflow-backend
npm install                                 # relinks node_modules/@cashflow/shared
```

Then commit `vendor/cashflow-shared` and `package-lock.json`.

## CI

`.github/workflows/ci.yml` runs on every push to `master` and every pull
request: lint, unit tests, and a production build.

Lint uses ESLint's bulk suppressions: the errors that existed before CI was
added are listed in `eslint-suppressions.json` and don't fail the build, but
any new error does. After fixing some of the existing ones, run
`npx eslint . --prune-suppressions` to shrink the list.
