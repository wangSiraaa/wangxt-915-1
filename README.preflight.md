# Trae Preflight

This folder is prepared for `wangxt-915-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18215
- API_PORT: 19215
- WEB_PORT: 20215
- DB_PORT: 21215
- REDIS_PORT: 22215

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
