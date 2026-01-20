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
fastapi-starter/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/
│   │           └── items.py
│   ├── core/
│   │   └── config.py
│   ├── schemas/
│   │   └── item.py
│   └── main.py
├── tests/
│   └── test_health.py
├── .env.example
├── requirements.txt
└── README.md
```

## Environment
Copy `.env.example` to `.env` and adjust as needed.

## Notes
- Swagger UI is available at `/docs` and ReDoc at `/redoc`.
- Versioned API under `/api/v1` path.
- Includes CORS setup and health endpoint.
