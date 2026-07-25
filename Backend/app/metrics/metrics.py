from prometheus_client import Counter,Histogram,Gauge


#cache
cache_hit = Counter("groundly-cache-hit-total","cache hit")

cache_misses = Counter("groundly-cache-misss-total","cache miss")

# Retrieval latency
retrieval_duration = Histogram(
    "groundly_retrieval_duration_seconds",
    "Hybrid retrieval latency"
)

#embedding duration
embedding_duration = Histogram(
    "groundly_embedding_duration_seconds",
    "model embedding latency"
)

#cross-encoder reranker duration
reranker_duration = Histogram(
    "groundly_reranker_duration_seconds",
    "cross encoder re-ranker latency"
)

# agent time response
agent_response_duration = Histogram(
    "groundly_agent_response_duration_seconds",
    "agent response latency"
)

agent_fail_response = Counter(
    "groundly_agent_fail_response_total",
    "number of agent failed response "
)

#gent number of max_iterations to answer user question
agent_number_of_interations = Counter("groundly-number-of-max_iterations-total",
                                "agent number of max_iterations to answer user question")

#gent tool used
total_tool_calls  = Counter("groundly_tool_calls_total",
"Total number of tool invocations",["tool_name"]
)

# agent token
completion_tokens = Histogram("groundly_completion_tokens_per_request",
    "Completion tokens per request"
)

completion_tokens_total = Counter("groundly_completion_tokens_total",
    "Total completion tokens processed"
)

total_tokens_count = Counter("groundly_total_tokens_count",
    "Total token count used"
)

model_prompt_tokens_count = Counter("groundly_model_prompt_tokens_total",
    "model total prompt  token count used"
)

tool_used_prompt_tokens_count = Counter("groundly_model_tool_used_prompt_tokens_total",
    "model tool use prompt token count"
)

# Queue 
active_jobs = Gauge("groundly_active_jobs","Number of Active ingestion jobs waiting in the queue")

job_started = Counter(
    "groundly_arq_jobs_started_total",
    "Total ARQ jobs started",
    ["job_id"]
)

job_completed = Counter(
    "groundly_arq_jobs_completed_total","Total ARQ jobs completed",
    ["job_id"]
)

job_failed = Counter(
    "groundly_arq_jobs_failed_total","Total ARQ jobs failed",
    ["job_id"]
)

job_duration = Histogram("groundly_arq_job_duration_seconds",
    "ARQ job execution time",["job_id"]
)

## document upload
document_upload_duration = Histogram(
"groundly_document_upload_duration_seconds",
    "End-to-end document upload duration"
)

tool_duration = Histogram("groundly_tool_duration_seconds",
    "Tool execution time",["tool_name","status"]
)

tool_failures = Counter("groundly_tool_failures_total",
    "Failed tool executions",
    ["tool_name","status"]
)