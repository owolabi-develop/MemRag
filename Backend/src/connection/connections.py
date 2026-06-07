import asyncpg
from dotenv import load_dotenv
import os
load_dotenv()


async def conn():
    try:
        con =  await asyncpg.create_pool(user=os.getenv("DB_USER"),
                                password=os.getenv("DB_PASSWORD"),
                                database=os.getenv("DB_NAME"),
                                host=os.getenv("DB_HOST"),
                                port=os.getenv("DB_PORT")
                                )
        print("Connected successfully")
        version = await con.fetchval("SELECT version();")
        print(f"PostgreSQL Version: {version}")
        return con 
    except Exception as e:
        print(f"connection Error {e}")
    
