# Roulette

Single-game Roulette app based on the live The Doctor roulette reference.

## Run

```bash
npm install
npm run dev
```

The app is intentionally scoped to Roulette only. API helpers target:

- `GET /games/house/roulette/config`
- `POST /games/house/roulette/bet`
- `GET /bets/latest`
- `GET /bets/latest/high-rollers`
- `GET /bets/latest/lucky`
- `GET /bets/latest/my`
- `GET /admin/balance/history`
