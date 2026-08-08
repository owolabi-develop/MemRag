from fastapi import APIRouter,status,Header
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User, Tenant, Conversation,ChatSession,FeedBack,FeedBackPublic,CreateFeedBack,UpdateFeedBack
from fastapi import UploadFile, Form
from typing import Annotated
from app.security import get_current_active_user
from src.agent_call import call_agent
import uuid
from src.guardrails.guardrails import GuardrailViolation,input_guard,output_guard,PIIDetectedError,ToxicContentError,DetectJailbreakContentError
from starlette.concurrency import run_in_threadpool
from src.utils.helper import context_api_key,context_cohere_api_key
router = APIRouter(prefix="/chat",
                   tags=['chats'])
from src.utils.helper import (get_current_user_dpt,
                              get_current_user_dpt_name,generate_session_title)

@router.post("/")
async def chatAgent(user_query: Annotated[str, Form()],session_id: Annotated[uuid.UUID, Form()],current_user:Annotated[User, Depends(get_current_active_user)],session:sessionCreator,x_gemini_api_key:Annotated[str| None, Header()]=None,x_gemini_model:Annotated[str | None, Header()]=None,x_cohere_api_key:Annotated[str | None, Header()]=None):
    
    print(f"model_name {x_gemini_model}")
    if not x_gemini_api_key :
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="failed to initialized chat, model API-Key is missing. check your settings page for update, then try again.")
    if not x_gemini_model :
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="failed to initialized chat Model-Name is missing.")
    if not x_cohere_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="failed initialized ranking Model API-K check your settings page for update, then try again.")
    if current_user.departments is None or len(current_user.departments) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {current_user.first_name} does not belong to any department.")
    
    user_dpt_name = await get_current_user_dpt_name(current_user.departments)
   
    current_user_details = f"{current_user.first_name}"
    
    ## auto create new section title
    new_session_title = await generate_session_title(user_query,str(x_gemini_model),x_gemini_api_key)
    existing_sec = await session.get(ChatSession,session_id)
    if existing_sec.title =="new":
        #update session title
        existing_sec.title =  new_session_title
        session.add(existing_sec)
        await session.commit()
    

    user_dpt = await get_current_user_dpt(current_user.departments)
    
    # try:
    #     await run_in_threadpool(input_guard().validate,user_query)
    # except (PIIDetectedError,ToxicContentError,DetectJailbreakContentError) as exec:
    #     raise exec
    token = context_api_key.set(x_gemini_api_key)
    rank_token = context_cohere_api_key.set(x_cohere_api_key)
    
    response = await call_agent(user_query, user_dpt,user_dpt_name,current_user_details,current_user.tenant_id, current_user.id,session_id,x_gemini_model,x_gemini_api_key)
    
    context_api_key.reset(token)
    context_cohere_api_key.reset(rank_token)
    
    
    return {"response": response}

@router.post("/feedback", response_model=FeedBackPublic, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    feedback_in: CreateFeedBack,
    session: sessionCreator,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    feedback = FeedBack(**feedback_in.model_dump(), user_id=current_user.id)
    session.add(feedback)
    await session.commit()
    await session.refresh(feedback)
    return feedback


@router.patch("/feedback/{feedback_id}", response_model=FeedBackPublic)
async def update_feedback(
    feedback_id: uuid.UUID,
    feedback_in: UpdateFeedBack,
    session: sessionCreator,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    feedback = await session.get(FeedBack, feedback_id)
    if feedback is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found"
        )

    if feedback.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own feedback.",
        )

    feedback.thumb = feedback_in.thumb
    session.add(feedback)
    await session.commit()
    await session.refresh(feedback)
    return feedback