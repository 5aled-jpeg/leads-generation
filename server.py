import os
import glob
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import pandas as pd
import requests
from dotenv import load_dotenv, set_key
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from src.places_api import search_places, get_coordinates
from src.business_info import process_businesses
from src.data_export import save_places_to_excel, load_excel_data
from src.utils import get_current_date, ainvoke_llm

load_dotenv()

app = FastAPI(title="Google Maps Lead Generator API")

# Enable CORS for Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)
ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")

# Global active scrape task state
active_task: Dict[str, Any] = {
    "running": False,
    "progress": 0.0,
    "current_step": "Idle",
    "total": 0,
    "current": 0,
    "current_business": "",
    "excel_file": None,
    "results": [],
    "error": None
}

is_scraping_stopped = False

class ScrapeRequest(BaseModel):
    location: str
    query: str
    pages: int = 1

class SettingsUpdate(BaseModel):
    serper_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    llm_model: Optional[str] = None

class KeyTestRequest(BaseModel):
    key: Optional[str] = None
    model: Optional[str] = None

@app.get("/api/status")
def get_status():
    load_dotenv(override=True)
    serper_key = os.getenv("SERPER_API_KEY", "")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
    groq_key = os.getenv("GROQ_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")
    
    return {
        "serper_configured": bool(serper_key and len(serper_key) > 5),
        "gemini_configured": bool(gemini_key and len(gemini_key) > 5),
        "openrouter_configured": bool(openrouter_key and len(openrouter_key) > 5),
        "groq_configured": bool(groq_key and len(groq_key) > 5),
        "openai_configured": bool(openai_key and len(openai_key) > 5),
        "active_model": os.getenv("LLM_MODEL", "gemini-3.5-flash-lite"),
        "active_task": {
            "running": active_task["running"],
            "progress": active_task["progress"],
            "current_step": active_task["current_step"],
            "total": active_task["total"],
            "current": active_task["current"],
            "current_business": active_task["current_business"],
            "excel_file": active_task["excel_file"],
            "results_count": len(active_task["results"]),
            "error": active_task["error"]
        }
    }

@app.get("/api/settings")
def get_settings():
    load_dotenv(override=True)
    def mask(k):
        if not k:
            return ""
        return k[:4] + "••••••••" + k[-4:] if len(k) > 8 else "••••••••"
        
    return {
        "serper_api_key": os.getenv("SERPER_API_KEY", ""),
        "gemini_api_key": os.getenv("GEMINI_API_KEY", ""),
        "groq_api_key": os.getenv("GROQ_API_KEY", ""),
        "openrouter_api_key": os.getenv("OPENROUTER_API_KEY", ""),
        "openai_api_key": os.getenv("OPENAI_API_KEY", ""),
        "llm_model": os.getenv("LLM_MODEL", "gemini-3.5-flash-lite"),
        "masked": {
            "serper_api_key": mask(os.getenv("SERPER_API_KEY", "")),
            "gemini_api_key": mask(os.getenv("GEMINI_API_KEY", "")),
            "groq_api_key": mask(os.getenv("GROQ_API_KEY", "")),
            "openrouter_api_key": mask(os.getenv("OPENROUTER_API_KEY", "")),
            "openai_api_key": mask(os.getenv("OPENAI_API_KEY", ""))
        }
    }

@app.post("/api/settings")
def save_settings(data: SettingsUpdate):
    if not os.path.exists(ENV_PATH):
        with open(ENV_PATH, "w") as f:
            f.write("")

    if data.serper_api_key is not None:
        set_key(ENV_PATH, "SERPER_API_KEY", data.serper_api_key)
        os.environ["SERPER_API_KEY"] = data.serper_api_key
    if data.gemini_api_key is not None:
        set_key(ENV_PATH, "GEMINI_API_KEY", data.gemini_api_key)
        os.environ["GEMINI_API_KEY"] = data.gemini_api_key
    if data.groq_api_key is not None:
        set_key(ENV_PATH, "GROQ_API_KEY", data.groq_api_key)
        os.environ["GROQ_API_KEY"] = data.groq_api_key
    if data.openrouter_api_key is not None:
        set_key(ENV_PATH, "OPENROUTER_API_KEY", data.openrouter_api_key)
        os.environ["OPENROUTER_API_KEY"] = data.openrouter_api_key
    if data.openai_api_key is not None:
        set_key(ENV_PATH, "OPENAI_API_KEY", data.openai_api_key)
        os.environ["OPENAI_API_KEY"] = data.openai_api_key
    if data.llm_model is not None:
        set_key(ENV_PATH, "LLM_MODEL", data.llm_model)
        os.environ["LLM_MODEL"] = data.llm_model
        
    return {"status": "success", "message": "Settings updated successfully"}

@app.post("/api/test-serper")
def test_serper(body: Optional[KeyTestRequest] = None):
    load_dotenv(override=True)
    api_key = (body.key if body and body.key else os.getenv("SERPER_API_KEY", "")).strip()
    if not api_key:
        return {"success": False, "error": "Please enter a Serper API key to test."}
    
    try:
        response = requests.post(
            "https://google.serper.dev/maps",
            headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
            json=[{"q": "Coffee Miami", "page": 1}],
            timeout=8
        )
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                places = data[0].get("places", [])
                credits = data[0].get("credits", None)
                msg = f"Connected ({len(places)} places verified"
                if credits is not None:
                    msg += f" • {credits} credit used)"
                else:
                    msg += ")"
                return {"success": True, "count": len(places), "msg": msg}
            return {"success": False, "error": "Serper returned empty results."}
        elif response.status_code in (401, 403):
            return {"success": False, "error": "Invalid API key (403 Unauthorized). Check your Serper key."}
        else:
            return {"success": False, "error": f"Serper returned status {response.status_code}"}
    except Exception as e:
        return {"success": False, "error": f"Connection error: {str(e)}"}

@app.post("/api/test-gemini")
async def test_gemini(body: Optional[KeyTestRequest] = None):
    load_dotenv(override=True)
    api_key = (body.key if body and body.key else os.getenv("GEMINI_API_KEY", "")).strip()
    if not api_key:
        return {"success": False, "error": "Please enter a Gemini API key to test."}
    
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
        target_model = body.model if (body and body.model) else "gemini-3.5-flash-lite"
        resp = await client.chat.completions.create(
            model=target_model,
            messages=[{"role": "user", "content": "Ping"}],
            max_tokens=5,
            timeout=8
        )
        return {"success": True, "msg": f"Connected ({target_model} ready)"}
    except Exception as e:
        return {"success": False, "error": f"Gemini error: {str(e)[:120]}"}

@app.post("/api/test-groq")
async def test_groq(body: Optional[KeyTestRequest] = None):
    load_dotenv(override=True)
    api_key = (body.key if body and body.key else os.getenv("GROQ_API_KEY", "")).strip()
    if not api_key:
        return {"success": False, "error": "Please enter a Groq API key to test."}
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
        await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "Ping"}],
            max_tokens=5,
            timeout=8
        )
        return {"success": True, "msg": "Connected (Groq API ready)"}
    except Exception as e:
        return {"success": False, "error": f"Groq error: {str(e)[:120]}"}

@app.post("/api/test-openrouter")
async def test_openrouter(body: Optional[KeyTestRequest] = None):
    load_dotenv(override=True)
    api_key = (body.key if body and body.key else os.getenv("OPENROUTER_API_KEY", "")).strip()
    if not api_key:
        return {"success": False, "error": "Please enter an OpenRouter API key to test."}
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
        await client.chat.completions.create(
            model="google/gemini-2.0-flash-lite-001",
            messages=[{"role": "user", "content": "Ping"}],
            max_tokens=5,
            timeout=8
        )
        return {"success": True, "msg": "Connected (OpenRouter ready)"}
    except Exception as e:
        return {"success": False, "error": f"OpenRouter error: {str(e)[:120]}"}

@app.post("/api/test-openai")
async def test_openai(body: Optional[KeyTestRequest] = None):
    load_dotenv(override=True)
    api_key = (body.key if body and body.key else os.getenv("OPENAI_API_KEY", "")).strip()
    if not api_key:
        return {"success": False, "error": "Please enter an OpenAI API key to test."}
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)
        await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Ping"}],
            max_tokens=5,
            timeout=8
        )
        return {"success": True, "msg": "Connected (OpenAI ready)"}
    except Exception as e:
        return {"success": False, "error": f"OpenAI error: {str(e)[:120]}"}

async def run_scraper_task(location: str, query: str, pages: int):
    global active_task, is_scraping_stopped
    is_scraping_stopped = False
    active_task["running"] = True
    active_task["progress"] = 0.05
    active_task["current_step"] = f"Locating '{location}'..."
    active_task["error"] = None
    active_task["results"] = []
    
    try:
        coords = get_coordinates(location)
        if coords:
            active_task["current_step"] = f"Coordinates found. Searching Google Maps for '{query}'..."
        else:
            active_task["current_step"] = f"Searching Google Maps directly for '{query}' in '{location}'..."
            
        active_task["progress"] = 0.15
        places_data = search_places(query, coords=coords, num_pages=pages, location=location)
        if not places_data:
            raise Exception("No places found on Google Maps. Verify query spelling or Serper key.")
            
        excel_filename = f"data_{query}_{location}_{get_current_date()}.xlsx"
        active_task["current_step"] = "Saving initial Google Places records..."
        active_task["progress"] = 0.25
        file_path = save_places_to_excel(places_data, excel_filename)
        active_task["excel_file"] = excel_filename

        # Callback for real-time progress
        async def on_progress(total, current, name):
            active_task["total"] = total
            active_task["current"] = current + 1
            active_task["current_business"] = name
            # Progress scales between 25% and 95%
            pct = 0.25 + 0.70 * ((current + 1) / total)
            active_task["progress"] = round(pct, 2)
            active_task["current_step"] = f"Scraping & Enriching ({current+1}/{total}): {name}"
            
            # Read latest saved data for live preview
            try:
                df, _ = load_excel_data(excel_filename)
                active_task["results"] = df.to_dict(orient="records")
            except Exception:
                pass

        active_task["current_step"] = "Visiting websites and extracting contacts with AI..."
        await process_businesses(
            excel_filename, 
            progress_callback=on_progress, 
            should_stop=lambda: is_scraping_stopped
        )
        
        # Load final results
        df, _ = load_excel_data(excel_filename)
        active_task["results"] = df.to_dict(orient="records")
        if is_scraping_stopped:
            active_task["current_step"] = "Stopped by user. Partial results saved."
        else:
            active_task["progress"] = 1.0
            active_task["current_step"] = "Complete! All leads generated and enriched."
    except Exception as e:
        active_task["error"] = str(e)
        active_task["current_step"] = f"Error: {e}"
    finally:
        active_task["running"] = False

@app.post("/api/scrape")
async def start_scrape(req: ScrapeRequest, background_tasks: BackgroundTasks):
    global active_task
    if active_task["running"]:
        raise HTTPException(status_code=400, detail="A scraping task is already running.")
        
    background_tasks.add_task(run_scraper_task, req.location, req.query, req.pages)
    return {"status": "started", "message": f"Scrape started for '{req.query}' in '{req.location}'"}

@app.post("/api/scrape/stop")
def stop_scrape():
    global active_task, is_scraping_stopped
    if active_task["running"]:
        is_scraping_stopped = True
        active_task["running"] = False
        active_task["current_step"] = "Stopping generation... Progress saved."
        return {"status": "success", "message": "Scrape task stopped"}
    return {"status": "ignored", "message": "No active scrape task running"}

@app.get("/api/scrape/status")
def scrape_status():
    return active_task

@app.get("/api/history")
def list_history():
    files = glob.glob(os.path.join(DATA_DIR, "*.xlsx"))
    results = []
    
    for f in sorted(files, key=os.path.getmtime, reverse=True):
        basename = os.path.basename(f)
        try:
            mtime = datetime.fromtimestamp(os.path.getmtime(f)).strftime("%Y-%m-%d %H:%M")
            df = pd.read_excel(f).fillna("")
            total_records = len(df)
            emails_count = len(df[df["email"].astype(str).str.strip() != ""])
            phones_count = len(df[df["phone"].astype(str).str.strip() != ""])
            websites_count = len(df[df["website"].astype(str).str.strip() != ""])
            
            results.append({
                "filename": basename,
                "date": mtime,
                "size_kb": round(os.path.getsize(f) / 1024, 1),
                "total_records": total_records,
                "emails_count": emails_count,
                "phones_count": phones_count,
                "websites_count": websites_count
            })
        except Exception as e:
            results.append({
                "filename": basename,
                "date": "Unknown",
                "size_kb": 0,
                "total_records": 0,
                "emails_count": 0,
                "phones_count": 0,
                "websites_count": 0,
                "error": str(e)
            })
    return results

@app.get("/api/history/{filename}")
def get_history_detail(filename: str):
    path = os.path.join(DATA_DIR, os.path.basename(filename))
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
        
    df = pd.read_excel(path).fillna("")
    return {
        "filename": os.path.basename(filename),
        "total": len(df),
        "records": df.to_dict(orient="records")
    }

@app.get("/api/download/{filename}")
def download_excel(filename: str):
    path = os.path.join(DATA_DIR, os.path.basename(filename))
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=os.path.basename(filename)
    )

# Mount frontend build if it exists
frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
