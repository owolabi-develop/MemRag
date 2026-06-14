from llmlingua import PromptCompressor
from src.prompts.prompts import COMPRESS_INSTRUCTION_TEMPLATE

llm_lingua = PromptCompressor(
    model_name="microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank",
    device_map="cpu",
    use_llmlingua2=True)



async def compress_prompt(demonstration_str: str,question:str):
    
    compressed_prompt = llm_lingua.compress_prompt(
    context=demonstration_str,
    instruction=COMPRESS_INSTRUCTION_TEMPLATE,
    question=question,
    target_token=1000,
    condition_compare=True,
    condition_in_question="after",
    rank_method="longllmlingua",
    use_sentence_level_filter=False,
    context_budget="+100",
    dynamic_context_compression_ratio=0.4,  
    reorder_context="sort",
)
    return compressed_prompt['compressed_prompt']