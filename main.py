import asyncio
from src.places_api import search_places, get_coordinates
from src.business_info import process_businesses
from src.data_export import save_places_to_excel
from src.utils import get_current_date
from dotenv import load_dotenv

load_dotenv()

async def main(location, search_query, num_pages):
    """
    Main function to orchestrate the lead generation process.
    
    Args:
        location (str): Location to search (city, address, etc.)
        search_query (str): What to search for (restaurants, dentists, etc.)
        num_pages (int): Number of pages to fetch (20 results per page)
    """
    print(f"\n🔍 Starting lead generation for '{search_query}' in '{location}'")
    
    # Step 1: Get coordinates from location (optional, falls back gracefully)
    coords = get_coordinates(location)
    if not coords:
        print(f"Notice: Geocoding bypassed. Searching Google Maps directly for '{location}'...")
        
    # Step 2: Search for places using Serper Maps API
    places_data = search_places(search_query, coords=coords, num_pages=num_pages, location=location)
    if not places_data:
        print("No places found on Google Maps. Check your query, location, or Serper API key.")
        return
        
    # Step 3: Save places data to Excel
    excel_filename = f"data_{search_query}_{location}_{get_current_date()}.xlsx"
    save_places_to_excel(places_data, excel_filename)
    
    # Step 4: Process businesses to get detailed information and update Excel file
    await process_businesses(excel_filename)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="AI-Powered Google Maps Lead Generator")
    parser.add_argument("--location", "-l", type=str, default="Toronto", help="Location to search (e.g. 'Miami', 'Toronto')")
    parser.add_argument("--query", "-q", type=str, default="Realtors", help="Business type to search for (e.g. 'Dentists', 'Plumbers')")
    parser.add_argument("--pages", "-p", type=int, default=1, help="Number of pages (20 results per page)")
    
    args = parser.parse_args()
    
    # Run main function
    asyncio.run(main(args.location, args.query, args.pages))
