import os
import json
import requests
from .utils import USER_AGENTS


def get_coordinates(city):
    """
    Convert a city name to latitude and longitude coordinates.
    Safely times out in 3 seconds; returns None if geocoding is unavailable.
    """
    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search", 
            params={"q": city, "format": "json"}, 
            headers={"User-Agent": "GoogleMapsLeadScraper/1.0 (contact@leadgen.local)"},
            timeout=3
        )
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0 and 'lat' in data[0] and 'lon' in data[0]:
                return {"lat": data[0]['lat'], "lon": data[0]['lon']}
        return None
    except Exception as e:
        print(f"Notice: Nominatim geocoding bypassed ({e}). Falling back to direct Maps search.")
        return None


def search_places(query, coords=None, num_pages=1, location=None):
    """
    Search for places using Serper Maps API.
    Supports both coordinate bounding box (@lat,lon,13z) and direct location query fallback.
    
    Args:
        query (str): Search query (e.g., "restaurants", "dentists")
        coords (dict, optional): Latitude and longitude dict
        num_pages (int): Number of pages to request (20 results per page)
        location (str, optional): City or location string if coords are not available
        
    Returns:
        list: List of places data from the API
    """
    payload = []
    
    # Create payload for each page
    for page in range(1, num_pages + 1):
        item = {"page": page}
        if coords and isinstance(coords, dict) and 'lat' in coords and 'lon' in coords:
            lat, lon = coords['lat'], coords['lon']
            item["q"] = query
            item["ll"] = f"@{lat},{lon},13z"
        else:
            item["q"] = f"{query} in {location}" if location else query
        payload.append(item)
    
    headers = {
        'X-API-KEY': os.getenv("SERPER_API_KEY", "").strip(),
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            "https://google.serper.dev/maps", 
            headers=headers, 
            data=json.dumps(payload),
            timeout=15
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: Serper API returned status code {response.status_code}: {response.text[:100]}")
            return []
            
    except Exception as e:
        print(f"Error making Serper API request: {e}")
        return []
