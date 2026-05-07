# chatta

Real-time chat application with SvelteKit frontend and backend services.

## Language Stack

- TypeScript / SvelteKit 2.x
- Node.js 20.x
- VSCode JSON-RPC for backend communication

## Key Commands

```bash
cd frontend && npm install && npm run dev
cd backend && npm install && npm run dev
```

## Key Files

- `README.md`
- `CHANGELOG.md`
- `frontend/` — SvelteKit frontend
- `backend/` — backend services

## Notes

- No package.json at repo root; frontend and backend each manage their own deps.
- CI: secrets scanning via `trufflehog.yml`.
