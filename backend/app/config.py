"""Centralised configuration (env-driven).

Mirrors a Spring Boot `application.yml` + `@ConfigurationProperties` so the
backend stays portable: only this module reads raw env vars.
"""
import os


class Settings:
    mongo_url: str = os.environ["MONGO_URL"]
    db_name: str = os.environ["DB_NAME"]

    jwt_secret: str = os.environ.get("JWT_SECRET", "dev-insecure-secret-change-me")
    jwt_issuer: str = os.environ.get("JWT_ISSUER", "expense-tracker-api")
    jwt_audience: str = os.environ.get("JWT_AUDIENCE", "expense-tracker-app")
    jwt_algorithm: str = "HS256"
    access_minutes: int = int(os.environ.get("ACCESS_MINUTES", "15"))
    refresh_days: int = int(os.environ.get("REFRESH_DAYS", "30"))

    admin_email: str = os.environ.get("ADMIN_EMAIL", "")
    admin_password: str = os.environ.get("ADMIN_PASSWORD", "")
    admin_id: str = os.environ.get("ADMIN_ID", "u_admin")
    demo_email: str = os.environ.get("DEMO_EMAIL", "")
    demo_password: str = os.environ.get("DEMO_PASSWORD", "")
    demo_id: str = os.environ.get("DEMO_ID", "u_demo")


settings = Settings()
