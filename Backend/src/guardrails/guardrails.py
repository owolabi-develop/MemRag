from guardrails import Guard
from guardrails_ai.profanity_free import ProfanityFree
from guardrails_ai.gibberish_text import GibberishText
from guardrails_ai.valid_length import ValidLength
from guardrails_ai.detect_pii import DetectPII
from guardrails_ai.toxic_language import ToxicLanguage
from guardrails_ai.detect_jailbreak import DetectJailbreak
import os

os.environ['GEMINI_API_KEY'] = os.getenv("GOOGLE_GEMINI_API_KEY")


guard = Guard(name="memgard")

class GuardrailViolation(Exception):
    user_message = "Your message couldn't be processed."
    status_code=400
    def __init__(self, message: str = None):
        final_message = message or self.user_message
        super().__init__(final_message)
        


class PIIDetectedError(GuardrailViolation):
    user_message = "Please remove personal information (like emails or phone numbers) from your message."


class ToxicContentError(GuardrailViolation):
    user_message = "Your message was flagged as inappropriate. Please rephrase."

class GibberishContentError(GuardrailViolation):
    user_message = "Your message was found to be gibberish Please try rephrasing your question."
    
class DetectJailbreakContentError(GuardrailViolation):
    user_message = "Your message was found to be  suspicious Please try rephrasing your question."

def detect_jailbreak_on_fail(value, fail_result):
   raise DetectJailbreakContentError

def pii_on_fail(value, fail_result):
   raise PIIDetectedError

def toxic_on_fail(value, fail_result):
   raise ToxicContentError

def gibberish_on_fail(value, fail_result):
   raise GibberishContentError

def input_guard():
    pii_entities = ["CREDIT_CARD","CRYPTO","DATE_TIME","EMAIL_ADDRESS",
    "IBAN_CODE","IP_ADDRESS","NRP","LOCATION","PERSON","PHONE_NUMBER",
    "MEDICAL_LICENSE","URL","US_BANK_NUMBER","US_DRIVER_LICENSE","US_ITIN",
    "US_PASSPORT","US_SSN","UK_NHS","ES_NIF","ES_NIE","IT_FISCAL_CODE",
    "IT_DRIVER_LICENSE","IT_VAT_CODE","IT_PASSPORT","IT_IDENTITY_CARD",
    "PL_PESEL","SG_NRIC_FIN","SG_UEN","AU_ABN","AU_ACN","AU_TFN",
    "AU_MEDICARE","IN_PAN","IN_AADHAAR","IN_VEHICLE_REGISTRATION",
    "IN_VOTER","IN_PASSPORT","FI_PERSONAL_IDENTITY_CODE"]

    return guard.use(
    ToxicLanguage(threshold=0.5, validation_method="sentence", on_fail=toxic_on_fail,use_local=True),
     DetectPII(pii_entities=pii_entities,on_fail=pii_on_fail),
    GibberishText(threshold=0.5, validation_method="sentence", on_fail=gibberish_on_fail), 
)



def output_guard():
    pii_entities = ["CREDIT_CARD","CRYPTO","DATE_TIME","EMAIL_ADDRESS",
    "IBAN_CODE","IP_ADDRESS","NRP","LOCATION","PERSON","PHONE_NUMBER",
    "MEDICAL_LICENSE","URL","US_BANK_NUMBER","US_DRIVER_LICENSE","US_ITIN",
    "US_PASSPORT","US_SSN","UK_NHS","ES_NIF","ES_NIE","IT_FISCAL_CODE",
    "IT_DRIVER_LICENSE","IT_VAT_CODE","IT_PASSPORT","IT_IDENTITY_CARD",
    "PL_PESEL","SG_NRIC_FIN","SG_UEN","AU_ABN","AU_ACN","AU_TFN",
    "AU_MEDICARE","IN_PAN","IN_AADHAAR","IN_VEHICLE_REGISTRATION",
    "IN_VOTER","IN_PASSPORT","FI_PERSONAL_IDENTITY_CODE"]

    return guard.use(
    ToxicLanguage(threshold=0.5, validation_method="sentence", on_fail="fix",use_local=True),
     DetectPII(pii_entities=pii_entities,on_fail='fix'),
    GibberishText(threshold=0.5, validation_method="sentence", on_fail="fix"), 
)

    
    