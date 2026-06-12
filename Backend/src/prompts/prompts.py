


QUERY_REWRITE_TEMPLATE="""
# Role
you are a professional sales training assistant

# Instructions
Reformulating the original user query to make it more suitable for
retrieval

# Context
USER QUERY:{user_query}

# Output format
return only the Reformulated user query without additional context
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