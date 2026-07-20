from llmlingua import PromptCompressor
from src.prompts.prompts import COMPRESS_INSTRUCTION_TEMPLATE
import os
LOCAL_LLMLINGUA_PATH = os.path.join(
    os.path.dirname(__file__), "llmlingua2_bert_meetingbank_local"
)
HUB_LLMLINGUA_NAME = "microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank"

if os.path.isdir(LOCAL_LLMLINGUA_PATH):
    llm_lingua = PromptCompressor(
        model_name=LOCAL_LLMLINGUA_PATH,
        device_map="cpu",
        use_llmlingua2=True,
    )
else:
    llm_lingua = PromptCompressor(
        model_name=HUB_LLMLINGUA_NAME,
        device_map="cpu",
        use_llmlingua2=True,
    )
    llm_lingua.model.save_pretrained(LOCAL_LLMLINGUA_PATH)
    llm_lingua.tokenizer.save_pretrained(LOCAL_LLMLINGUA_PATH)


async def compress_prompt(demonstration_str: str, question: str):
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
    return compressed_prompt["compressed_prompt"]