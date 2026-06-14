


QUERY_REWRITE_EXPAND_TEMPLATE="""
# Role
you are a professional sales training assistant

# Instructions
 - Reformulating the original user query to make it more suitable for
retrieval
 -  focuses on broadening the original query to capture more relevant
information

# Context
USER QUERY:{user_query}

# Output format
return only the Reformulated and broadening user query without additional context
"""

SALE_AGENT_TEMPLATE ="""
# Role
You are a professional sale agent assistant

#Instruction
Answer the user's question using ONLY the provided context below

# CONTEXT
Retrieved context:
{retrieved_context}

USER QUERY:
{user_query}
"""


COMPRESS_INSTRUCTION_TEMPLATE = """
Write a high-quality answer for the given question using only 
the provided search results (some of which might be irrelevant
"""
