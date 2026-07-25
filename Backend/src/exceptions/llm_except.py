from google.genai import errors

class LLMError(Exception):
    error_message = "Error Occur"
    code = 503
    
    def __init__(self,message: str = None):
        final_message = message or self.error_message
        super().__init__(final_message)
        
        

class InvalidArgumentError(LLMError):
    error_message = (
        "Groundly sent an invalid request to the AI service. "
        "Please verify your model configuration and request parameters, then try again."
    )
    
class AuthenticationError(LLMError):
      ## client error
    code = 400
    status="INVALID_ARGUMENT"
    error_message =  (
        "Groundly couldn't authenticate with the AI provider. "
        "Please verify your API credentials and try again.")
    
class UnavailableError(LLMError):
      ## server error
    status="UNAVAILABLE"
    code = 503
    error_message = "The service is temporarily unavailable. Please try again shortly."
    

class ResourceExhausted(LLMError):
    ## client error
    status="RESOURCE_EXHAUSTED"
    code = 429
    error_message = (
        "Groundly service is temporarily unavailable because its usage quota or rate limit has been reached. "
        "Please try again in a few minutes. If the problem continues, contact your administrator or check your API quota and billing settings."
    )
    
class LLMRateLimitError(LLMError):
    user_message =("Too many requests have been sent to the AI service. "
        "Please wait a moment and try again.")
    