import asyncpg
from dotenv import load_dotenv
import os
load_dotenv(override=True)
from pgvector.asyncpg import register_vector


async def init_connection(conn):
    await register_vector(conn)


async def get_db_pool():
    try:
        pool =  await asyncpg.create_pool(user=os.getenv("DB_USER"),
                                password=os.getenv("DB_PASSWORD"),
                                database=os.getenv("DB_NAME"),
                                host=os.getenv("DB_HOST"),
                                port=os.getenv("DB_PORT"),
                                init=init_connection
                                )
        print("Connected successfully")
        version = await pool.fetchval("SELECT version();")
        print(f"PostgreSQL Version: {version}")
        return pool 
    except Exception as e:
        print(f"connection Error {e}")


    
