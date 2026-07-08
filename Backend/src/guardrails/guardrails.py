from google.cloud import modelarmor_v1
from google.api_core.client_options import ClientOptions
import os
# Define the regional endpoint for us-central1
endpoint = "modelarmor.us-central1.rep.googleapis.com"

# Initialize the client with specific regional options
ma_client = modelarmor_v1.ModelArmorClient(
    credentials=modelarmor_v1.ModelArmorClient.from_service_account_file(),
    client_options=ClientOptions(api_endpoint=endpoint)
)
