import asyncpg
from dotenv import load_dotenv
import os
load_dotenv(override=True)
import json
from pgvector.asyncpg import register_vector

async def setup_codec(conn):
    for json_type in ['json', 'jsonb']:
        await conn.set_type_codec(
            json_type,
            encoder=json.dumps,
            decoder=json.loads,
            schema='pg_catalog'
        )

async def init_connection(conn):
    await register_vector(conn)
    await setup_codec(conn)

pool = None
async def get_db_pool():
    global pool
    if pool is None:
        pool =  await asyncpg.create_pool(user=os.getenv("DB_USER"),
                            password=os.getenv("DB_PASSWORD"),
                            database=os.getenv("DB_NAME"),
                            host=os.getenv("DB_HOST"),
                            port=os.getenv("DB_PORT"),
                            init=init_connection
                            )
    print("Connected successfully")
    return pool 
   


    
