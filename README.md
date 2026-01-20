# ReleaseRite

A minimal, production-friendly tool used for managing releases of services.

## Quickstart

```bash
# 1) Create venv (macOS/Linux)
python3 -m venv .venv
source .venv/bin/activate

#    Windows (PowerShell)
# python -m venv .venv
# .venv\Scripts\activate

# 2) Install deps
pip install --upgrade pip
pip install -r requirements.txt

# 3) Run the API
uvicorn app.main:app --reload

# 4) Explore docs
# Swagger UI
# http://127.0.0.1:8000/docs
# ReDoc
# http://127.0.0.1:8000/redoc
```

## Project Structure
```
release-manager/
├── .github/
│   └── workflows/
│       └── pylint.yml
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py
│   │       │   ├── environment.py
│   │       │   ├── releases.py
│   │       │   ├── role.py
│   │       │   ├── service.py
│   │       │   └── user.py
│   │       └── dependencies.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/
│   ├── schemas/
│   └── main.py
├── scripts/
│   ├── init_db.py
│   ├── migrate_deployments.py
│   ├── migrate_release_columns.py
│   ├── migrate_service_version.py
│   ├── recreate_tables.py
│   ├── reset_admin.py
│   ├── seed_users.py
│   └── update_roles.py
├── tests/
│   └── test_health.py
├── ui/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── .pylintrc
├── docker-compose.yaml
├── requirements.txt
├── start_app.sh
└── README.md
```

## Environment
Copy `.env.example` to `.env` and adjust as needed.

## Notes
- Swagger UI is available at `/docs` and ReDoc at `/redoc`.
- Versioned API under `/api/v1` path.
- Includes CORS setup and health endpoint.
