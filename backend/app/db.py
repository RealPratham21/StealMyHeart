from psycopg_pool import ConnectionPool
from .config import DATABASE_URL

db_pool = ConnectionPool(conninfo=DATABASE_URL, open=False)


def open_db_pool() -> None:
    db_pool.open()


def close_db_pool() -> None:
    db_pool.close()
