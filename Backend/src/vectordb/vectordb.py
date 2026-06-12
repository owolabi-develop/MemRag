
class StoreManager:
    """Manages all stores (vector stores and SQL tables) with getter methods for easy access."""
    
    def __init__(self, pool):
        """
        Initialize all stores.
        
        Args:
            client: postgres database connection

        """
        self.pool = pool
    async def create_db(self):
         
        table_names = {"knowledge_base":["SEMANTIC_MEMORY_SALES",
                                         "SEMANTIC_MEMORY_INSURANCE",
                                         "SEMANTIC_MEMORY_POLICY","SEMANTIC_MEMORY_TECHNICAL"],
              "workflow":"WORKFLOW_MEMORY",
              "toolbox":"TOOLBOX_MEMORY",
              "entity":"ENTITY_MEMORY",
              "summary":"SUMMARY_MEMORY"
              }
        
        # Initialize all vector stores
        for kb_name in table_names['knowledge_base']:
            self._knowledge_base_vs= await self.create_vector_store(
                table_name=kb_name,
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
        
        ## initialize sql tables
        self._create_conversational_history_table = await self.create_conversational_history_table()
        
        self._create_tool_log_table = await self.create_tool_log_table()
        
        
    async def create_vector_store(self,table_name):
    
        async with self.pool.acquire() as con:
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
                            metadata JSONB,
                            embedding vector(768)
                             );
                        """)
            await con.execute(f"""
                        CREATE INDEX ON {table_name} USING hnsw (embedding vector_cosine_ops);
                        """)
            await con.execute(f"""
                             CREATE INDEX ON {table_name} USING GIN (to_tsvector('english', content));
                            """)
            
        print(f" Table {table_name} created successfully with indexes")
        
    async def create_tool_log_table(self,table_name: str = "TOOL_LOG_MEMORY"):
        """
        Create a table to store raw tool execution logs per thread.
        If the table already exists, returns the table name without recreating it.
        """
       
        async with self.pool.acquire() as con:
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

    async def create_conversational_history_table(self, table_name: str = "CONVERSATIONAL_MEMORY"):
        """
        Create a table to store conversational history.

        Args:
            table_name: Name of the table to create
        """
        async with self.pool.acquire() as con:
            # Drop table if exists
            try:
                await con.execute(f"DROP TABLE IF EXISTS {table_name}")
            except:
                pass  # Table doesn't exist
            
            # Create table with proper schema
            await con.execute(f"""
                CREATE TABLE {table_name} (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    thread_id VARCHAR(100) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    con_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    summary_id VARCHAR(100) DEFAULT NULL
                )
            """)
            
            # Create index on thread_id for faster lookups
            await con.execute(f"""
                CREATE INDEX idx_{table_name.lower()}_thread_id ON {table_name}(thread_id)
            """)
            
            # Create index on timestamp for ordering
            await con.execute(f"""
                CREATE INDEX idx_{table_name.lower()}_con_timestamp ON {table_name}(con_timestamp)
            """)
            
        print(f"Table {table_name} created successfully with indexes")
        return table_name
            
    
   