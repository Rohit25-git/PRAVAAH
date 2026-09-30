from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config.settings import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

is_sqlite = db_url.startswith("sqlite")

# PostgreSQL connects with isolated pravaah schema search path first, followed by public (for PostGIS functions)
connect_args = (
    {"check_same_thread": False}
    if is_sqlite
    else {"options": "-c search_path=pravaah,public"}
)

engine_kwargs = {
    "connect_args": connect_args,
    "pool_pre_ping": True,
}

if not is_sqlite:
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
    })

engine = create_engine(db_url, **engine_kwargs)

# Schema isolation: PostgreSQL tables are created strictly inside 'pravaah' schema
# This guarantees existing CrimeGraph tables in 'public' are completely untouched.
metadata = MetaData() if is_sqlite else MetaData(schema="pravaah")
Base = declarative_base(metadata=metadata)

def init_db_schema():
    """
    Safely creates the 'pravaah' PostgreSQL schema and initializes all PRAVAAH tables
    strictly inside the 'pravaah' namespace. CrimeGraph 'public' tables are never touched.
    """
    if not is_sqlite:
        try:
            with engine.connect() as conn:
                # 1. Safely create isolated schema
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS pravaah;"))
                # 2. Verify / enable PostGIS extension in database
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.commit()
        except Exception:
            pass
    Base.metadata.create_all(bind=engine)

# Auto-execute schema initialization on import if PostgreSQL
if not is_sqlite:
    try:
        init_db_schema()
    except Exception:
        pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
