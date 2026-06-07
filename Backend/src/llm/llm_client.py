from google import genai
import os
from dotenv import load_dotenv
load_dotenv(override=True)

client = genai.Client(api_key=os.getenv("GOOGLE_GEMINI_API_KEY"))