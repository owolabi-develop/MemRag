import os
import getpass
import time
import numpy as np
from src.llm.llm_client import client
import asyncio
from google.genai import errors
import cohere
import yaml

os.environ['GEMINI_API_KEY'] = os.getenv("GOOGLE_GEMINI_API_KEY")


    

sample_docs = [
    {
        "content": "A motor insurance claim must be reported within 48 hours of the incident. Claims submitted after this period may require additional approval and supporting documentation.",
        "metadata": {
            "bbox": [45, 120, 520, 265],
            "source": "Motor Claims Manual.pdf",
            "section_title": "Claim Notification",
            "page": 8,
            "department": "Claims",
            "document_id": "doc_001"
        }
    },
    {
        "content": "Underwriters must verify the customer's identity, proof of address, and vehicle registration before issuing a comprehensive motor insurance policy.",
        "metadata": {
            "bbox": [60, 180, 540, 320],
            "source": "Underwriting SOP.pdf",
            "section_title": "Customer Verification",
            "page": 12,
            "department": "Underwriting",
            "document_id": "doc_002"
        }
    },
    {
        "content": "Employees should escalate all suspected fraud cases to the Special Investigation Unit within one business day. Do not notify the customer before SIU review.",
        "metadata": {
            "bbox": [52, 135, 515, 290],
            "source": "Fraud Policy.pdf",
            "section_title": "Fraud Escalation",
            "page": 6,
            "department": "Compliance",
            "document_id": "doc_003"
        }
    },
    {
        "content": "Customer personal information must not be shared outside the organization unless explicitly permitted by applicable data protection regulations or written customer consent.",
        "metadata": {
            "bbox": [38, 105, 500, 260],
            "source": "Data Privacy Policy.pdf",
            "section_title": "Customer Data Protection",
            "page": 14,
            "department": "Compliance",
            "document_id": "doc_004"
        }
    },
    {
        "content": "Life insurance applications with a sum assured above $500,000 require a medical examination and approval from a senior underwriter.",
        "metadata": {
            "bbox": [40, 210, 530, 355],
            "source": "Life Underwriting Guide.pdf",
            "section_title": "Medical Requirements",
            "page": 19,
            "department": "Underwriting",
            "document_id": "doc_005"
        }
    },
    {
        "content": "Travel insurance covers emergency medical expenses, trip cancellation, and lost baggage, subject to policy exclusions and coverage limits.",
        "metadata": {
            "bbox": [55, 150, 510, 295],
            "source": "Travel Insurance Handbook.pdf",
            "section_title": "Coverage Overview",
            "page": 4,
            "department": "Products",
            "document_id": "doc_006"
        }
    },
    {
        "content": "All customer complaints must receive an acknowledgement within 24 hours and a final response within 10 business days.",
        "metadata": {
            "bbox": [62, 172, 525, 310],
            "source": "Customer Service SOP.pdf",
            "section_title": "Complaint Handling",
            "page": 9,
            "department": "Customer Service",
            "document_id": "doc_007"
        }
    },
    {
        "content": "Policy renewals should be generated 30 days before expiration. Customers should receive automated email reminders at 30, 14, and 7 days before expiry.",
        "metadata": {
            "bbox": [48, 132, 518, 286],
            "source": "Policy Administration Guide.pdf",
            "section_title": "Renewal Process",
            "page": 11,
            "department": "Policy Administration",
            "document_id": "doc_008"
        }
    }
]
yaml_docs = [yaml.dump(doc, sort_keys=False) for doc in sample_docs]


async def main():
    
   co = cohere.ClientV2(
    "6fhVyYFRP5KIPi6Kr8Ir1WhUcc1uhfbVqOfNOdrI") 
   
   query = "How long does a customer have to report a motor insurance claim?"

   results = co.rerank(
        model="rerank-v4.0-pro", query=query, documents=yaml_docs, top_n=3
    )
  
   print(results)

   ranked_docs = [sample_docs[result.index] for result in results.results]
   

   print(ranked_docs)
   return 
    
  
        

    

asyncio.run(main())
