# **Google Maps Lead Generator: Find & Enrich Business Leads Using AI**

A modern, high-performance lead generation and enrichment platform that extracts verified business leads from Google Maps, scrapes company websites, and enriches contact details (emails, phone numbers, social media links, and opening hours) using AI.

---

## 🌟 **Features**

- **Modern Web Dashboard**: Sleek, minimalist user interface with dark/light editorial themes, real-time scraping progress, and live data preview.
- **Multiple AI Extraction Providers**:
  - **Google Gemini** (Free tier via Google AI Studio — `gemini-3.5-flash-lite`, zero cost)
  - **Groq** (Ultra-fast cloud inference with Llama 3.3)
  - **OpenRouter** (Unified multi-provider aggregator)
  - **Built-in Smart Heuristic** (Zero-key rule-based extraction fallback)
- **Comprehensive Lead Data**:
  - Business name, address, category & keywords
  - Direct 1-click clickable website links
  - Emails with 1-click copy & verification
  - Phone numbers
  - Real SVG Social links (LinkedIn, Instagram, Facebook, X/Twitter)
  - Structured, human-readable opening hours schedule
  - Google rating & reviews count
- **Real-Time Auto-Save**: Saves incrementally to Excel (`.xlsx`) after every single lead is processed so no data is ever lost.
- **Saved Collections Inspector**: Search, inspect, expand details, and export previously scraped lead collections with full horizontal scroll and 1-click downloads.
- **CLI & Streamlit Support**: Run directly via Python CLI, modern FastAPI web dashboard, or Streamlit.

---

## 🚀 **Quick Start**

### 1. Prerequisites
- Python 3.9+
- [Serper API key](https://serper.dev/) (Free tier gives 2,500 free searches)
- [Google AI Studio API key](https://aistudio.google.com/) (Free tier gives 1,500 requests/day)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/google-maps-lead-generator.git
cd google-maps-lead-generator

# Create a virtual environment (optional but recommended)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browser
playwright install chromium
```

### 3. Configure API Keys
Copy the example environment file:
```bash
cp .env.example .env
```
Edit `.env` with your keys:
```env
SERPER_API_KEY=your_serper_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-3.5-flash-lite
```
*(You can also configure and test all API keys directly in the Web Dashboard under System Settings).*

---

## 💻 **Usage**

### Option A: Modern Web Dashboard (Recommended)
Launch the full web interface:
```bash
python server.py
```
Open **`http://localhost:8000`** in your browser.

### Option B: Command Line (CLI)
Run searches directly from PowerShell or Terminal:
```bash
# Format: --location <City/State> --query <Niche/Service> --pages <Count>
python main.py --location "Miami, FL" --query "Real Estate Agents" --pages 1
```

### Option C: Streamlit GUI
```bash
streamlit run app.py
```

---

## 🛠️ **Project Structure**

```
.
├── server.py              # FastAPI backend serving API & modern UI
├── main.py                # Command-line scraper runner
├── app.py                 # Streamlit dashboard
├── src/
│   ├── places_api.py      # Google Maps API (Serper.dev) with geocoding fallback
│   ├── web_scraper.py     # Fast website content extraction with Playwright
│   ├── business_info.py   # AI contact enrichment & real-time auto-saving
│   ├── data_export.py     # Excel export & formatting
│   └── utils.py           # Multi-provider LLM integrations (Gemini, Groq, OpenRouter)
├── frontend/              # Modern React + TypeScript + Tailwind UI
│   ├── src/components/    # Scraper, Leads Collection, Settings & Analytics tabs
│   └── dist/              # Pre-compiled production UI bundle
├── data/                  # Output directory for exported Excel files (.gitignored)
├── requirements.txt       # Python dependencies
├── .env.example           # Example environment template
└── .gitignore             # Strict privacy rules (excludes .env and scraped data)
```

---

## 🔒 **Privacy & Data Security**
- `.env` files are strictly excluded via `.gitignore` to prevent leaking API keys.
- All scraped lead files in `data/*.xlsx` are excluded from version control, keeping your search history and lead lists private.

---

## 📄 **License**
MIT License. Feel free to use, modify, and build upon this tool for commercial or personal projects.
