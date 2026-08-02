from pgvector.asyncpg import register_vector
import asyncpg
import os
import json
class StoreManager:
    """Manages all stores (vector stores and SQL tables) with getter methods for easy access."""
    
    pool = None
    
    def __init__(self):
        """
        Initialize all stores.
        
        Args:
            client: postgres database connection

        """
    @classmethod
    async def setup_codec(cls,conn):
        for json_type in ['json', 'jsonb']:
            await conn.set_type_codec(
                json_type,
                encoder=json.dumps,
                decoder=json.loads,
                schema='pg_catalog'
            )
            
    @classmethod
    async def init_connection(cls,conn):
        await register_vector(conn)
        await cls.setup_codec(conn)
        
    @classmethod
    async def get_pool(cls):
        if cls.pool is None:
            cls.pool = await asyncpg.create_pool(
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                database=os.getenv("DB_NAME"),
                host=os.getenv("DB_HOST"),
                port=os.getenv("DB_PORT"),
                init=cls.init_connection
            )
            print("Connected successfully")
        return cls.pool
    
    async def create_db(self):
         
        table_names = {"knowledge_base":"SEMANTIC_MEMORY",
             "workflow":"WORKFLOW_MEMORY",
              "toolbox":"TOOLBOX_MEMORY",
              "entity":"ENTITY_MEMORY",
              "summary":"SUMMARY_MEMORY"
              }
        
        self._knowledge_base_vs= await self.create_vector_kb_store(
                table_name=table_names['knowledge_base'],
            )
        
        
        self._workflow_vs = await self.create_vector_store(
            table_name=table_names['workflow'],
           
        )
        
        self._toolbox_vs = await self.create_vector_store(
            table_name=table_names['toolbox'],
        )
        
        self._entity_vs = await self.create_vector_store(
            table_name=table_names['entity'],
            
        )
        
        self._summary_vs = await self.create_vector_store(
            table_name=table_names['summary'],
        )
        
        
        self._create_tool_log_table = await self.create_tool_log_table()
        
        
    async def create_vector_store(self,table_name):
        pool = await StoreManager.get_pool()
        async with pool.acquire() as con:
           ## DROP TABLE IF EXISTS 
            await con.execute("CREATE EXTENSION IF NOT EXISTS vector")
            try:
                await con.execute(f"DROP TABLE IF EXISTS {table_name}")
            except:
                pass
            if table_name == "WORKFLOW_MEMORY" or table_name == "ENTITY_MEMORY" or table_name == "SUMMARY_MEMORY":
                await con.execute(f"""
                        CREATE TABLE {table_name} (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            content text NOT NULL,
                            tenant_id UUID DEFAULT gen_random_uuid(),
                            metadata JSONB,
                            embedding vector(1536)
                             );
                        """)
                await con.execute(f"""
                                    CREATE INDEX idx_{table_name.lower()}_tenant_id ON {table_name}(tenant_id)
                                """)
            else:   
                await con.execute(f"""
                        CREATE TABLE {table_name} (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            content text NOT NULL,
                            metadata JSONB,
                            embedding vector(1536)
                             );
                        """)
                await con.execute(f"""
                        CREATE INDEX ON {table_name} USING hnsw (embedding vector_cosine_ops);
                        """)
                await con.execute(f"""
                             CREATE INDEX ON {table_name} USING GIN (to_tsvector('english', content));
                            """)
            
        print(f" Table {table_name} created successfully with indexes")
        
    async def create_vector_kb_store(self,table_name):
        pool = await StoreManager.get_pool()
        async with pool.acquire() as con:
                   ## DROP TABLE IF EXISTS 
                    try:
                        await con.execute(f"DROP TABLE IF EXISTS {table_name}")
                        await con.execute("CREATE EXTENSION vector;")
                    except:
                        pass
                    await con.execute(f"""
                                CREATE TABLE {table_name} (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    content text NOT NULL,
                                    department_name varchar(20) NOT NULL,
                                    tenant_id UUID DEFAULT gen_random_uuid(),
                                    department_id UUID DEFAULT gen_random_uuid(),
                                    metadata JSONB,
                                    embedding vector(1536)
                                     );
                                """)
                    await con.execute(f"""
                                CREATE INDEX ON {table_name} USING hnsw (embedding vector_cosine_ops);
                                """)
                    await con.execute(f"""
                                     CREATE INDEX ON {table_name} USING GIN (to_tsvector('english', content));
                                    """)
                    await con.execute(f"""
                                    CREATE INDEX idx_{table_name.lower()}_department_name ON {table_name}(department_name)
                                """)
                    await con.execute(f"""
                                    CREATE INDEX idx_{table_name.lower()}_department_id ON {table_name}(department_id)
                                """)
                    await con.execute(f"""
                                    CREATE INDEX idx_{table_name.lower()}_tenant_id ON {table_name}(tenant_id)
                                """)
                    
                    
        print(f" Table {table_name} created successfully with indexes")
        
    async def create_tool_log_table(self,table_name: str = "TOOL_LOG_MEMORY"):
        """
        Create a table to store raw tool execution logs per thread.
        If the table already exists, returns the table name without recreating it.
        """
        pool = await StoreManager.get_pool()
        async with pool.acquire() as con:
            try:
               await con.execute(f"DROP TABLE IF EXISTS {table_name}")
            except:
                pass
            
            await con.execute(f"""
                CREATE TABLE {table_name} (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    thread_id VARCHAR(100) NOT NULL,
                    tool_call_id VARCHAR(200),
                    tool_name VARCHAR(200) NOT NULL,
                    tool_args JSONB,
                    result TEXT,
                    result_preview VARCHAR(2000),
                    status VARCHAR(30) DEFAULT 'success',
                    error_message TEXT,
                    metadata JSONB,
                    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            await con.execute(f"""
                CREATE INDEX idx_{table_name.lower()}_thread_id ON {table_name}(thread_id)
            """)
            await con.execute(f"""
                CREATE INDEX idx_{table_name.lower()}_tool_name ON {table_name}(tool_name)
            """)
            await con.execute(f"""
                CREATE INDEX idx_{table_name.lower()}_log_timestamp ON {table_name}(log_timestamp)
            """)

        print(f" Table {table_name} created successfully with indexes")
        
        return table_name

    
            
    
   