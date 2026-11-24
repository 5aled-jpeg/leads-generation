import os
from langchain_openai import ChatOpenAI
from datetime import datetime

# User agents for web scraping
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36"
]

def get_current_date():
    return datetime.now().strftime("%Y-%m-%d_%H-%M")

async def ainvoke_llm(
    model,  # Specify the model name
    system_prompt,
    user_message,
    response_format=None,
    temperature=0.1
):
    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    llm = None
    if gemini_key:
        llm = ChatOpenAI(
            model=model if model and "gemini" in model else "gemini-3.5-flash-lite",
            temperature=temperature,
            openai_api_key=gemini_key,
            openai_api_base="https://generativelanguage.googleapis.com/v1beta/openai/",
        )
    elif groq_key:
        llm = ChatOpenAI(
            model=model if model and ("llama" in model or "mixtral" in model) else "llama-3.3-70b-versatile",
            temperature=temperature,
            openai_api_key=groq_key,
            openai_api_base="https://api.groq.com/openai/v1",
        )
    elif openrouter_key:
        llm = ChatOpenAI(
            model=model or os.getenv("LLM_MODEL", "meta-llama/llama-3.3-70b-instruct:free"),
            temperature=temperature,
            openai_api_key=openrouter_key,
            openai_api_base="https://openrouter.ai/api/v1",
        )
    elif openai_key:
        llm = ChatOpenAI(
            model=model or "gpt-4o-mini",
            temperature=temperature,
            openai_api_key=openai_key,
        )
    else:
        # No LLM API key provided - return None to trigger smart heuristic fallback
        return None
    
    try:
        # If Response format is provided, use structured output
        if response_format:
            llm = llm.with_structured_output(response_format)
        
        # Prepare messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        # Invoke LLM asynchronously
        response = await llm.ainvoke(messages)
        return response if response_format else response.content
    except Exception as e:
        print(f"LLM invocation failed: {e}. Falling back to heuristic extraction.")
        return None
