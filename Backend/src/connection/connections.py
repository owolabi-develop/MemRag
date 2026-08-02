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
        DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:5432/{os.getenv('DB_NAME')}"
        pool =  await asyncpg.create_pool(dsn=DATABASE_URL,
                            init=init_connection
                            )
        
    print("Connected successfully")
    return pool 
   


    
