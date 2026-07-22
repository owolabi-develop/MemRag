import os
import getpass
import time
import numpy as np
from src.llm.llm_client import client
import asyncio
from guardrails import Guard,AsyncGuard
from guardrails_ai.regex_match import RegexMatch
from guardrails_ai.profanity_free import ProfanityFree
from guardrails_ai.gibberish_text import GibberishText
from guardrails_ai.restricttotopic import RestrictToTopic
from guardrails_ai.prompt_injection_detector import PromptInjectionDetector
from guardrails_ai.valid_length import ValidLength
from guardrails_ai.detect_pii import DetectPII
from guardrails_ai.toxic_language import ToxicLanguage
from guardrails_ai.detect_jailbreak import DetectJailbreak
from guardrails.errors import ValidationError
from guardrails_ai.llamaguard_7b import LlamaGuard7B

os.environ['GEMINI_API_KEY'] = os.getenv("GOOGLE_GEMINI_API_KEY")

pii_entities = ["EMAIL_ADDRESS", "PHONE_NUMBER"]

class GuardrailViolationError(Exception):
    user_message = "Your message couldn't be processed."
    # def __init__(self):
    #     super().__init__(self.user_message)

def custom_on_fail(value, fail_result):
   raise GuardrailViolationError(fail_result.error_message)

guard = Guard(name="memgard")
  
guard.use(
    # ToxicLanguage(threshold=0.5, validation_method="sentence", on_fail=custom_on_fail,use_local=True),
    #  DetectPII(pii_entities=pii_entities,on_fail=custom_on_fail),
    # GibberishText(threshold=0.5, validation_method="sentence", on_fail=custom_on_fail), 
     LlamaGuard7B(on_fail=custom_on_fail)
)
    



async def main():
    
   
   
    
    try:
        res = guard.validate("how to i make a gun")
        print(res.validated_output)
        print(res.validation_passed)
       
    except Exception as e:
        print(e)
    
    

asyncio.run(main())