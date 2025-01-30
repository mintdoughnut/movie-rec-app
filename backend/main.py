from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import requests
import os


# Load API key from .env file
load_dotenv()
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

app = FastAPI()


TMDB_BASE_URL = "https://api.themoviedb.org/3"

# Fetch genres once and store them globally
GENRE_MAP = {}

def fetch_genres():
    """Fetches all genre mappings from TMDb and stores them globally."""
    global GENRE_MAP
    genre_url = f"{TMDB_BASE_URL}/genre/movie/list"
    response = requests.get(genre_url, params={"api_key": TMDB_API_KEY})
    if response.status_code == 200:
        genres = response.json().get("genres", [])
        GENRE_MAP = {genre["id"]: genre["name"] for genre in genres}

# Fetch genres on startup
fetch_genres()

@app.get("/search/")
def search_movie(query: str):
    url = f"{TMDB_BASE_URL}/search/movie"
    params = {"api_key": TMDB_API_KEY, "query": query}

    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        data = response.json()
        results = data.get("results", [])

        filtered_results = [
            {
                "id": movie["id"],  # Ensure ID is included
                "title": movie["title"],
                "overview": movie["overview"],
                "release_date": movie.get("release_date", "N/A"),
                "poster_path": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}" if movie.get("poster_path") else None,
                "rating": movie.get("vote_average", "N/A"),
                "popularity": movie.get("popularity", 0),
                "vote_count": movie.get("vote_count", 0)
            }
            for movie in results
            if movie.get("vote_count", 0) > 100 and movie.get("popularity", 0) > 10
        ]

        sorted_results = sorted(filtered_results, key=lambda x: x["popularity"], reverse=True)
        return {"results": sorted_results}

    return {"error": "Failed to fetch data"}

# Endpoint to get movie details
@app.get("/movie/{movie_id}")
def get_movie_details(movie_id: int):
    url = f"{TMDB_BASE_URL}/movie/{movie_id}"
    params = {"api_key": TMDB_API_KEY}
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    return {"error": "Failed to fetch data"}

@app.get("/recommendations/{movie_id}")
def get_recommendations(movie_id: int):
    """Fetches movie recommendations and maps genre_ids to genre names."""
    url = f"{TMDB_BASE_URL}/movie/{movie_id}/recommendations"
    params = {"api_key": TMDB_API_KEY}

    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()
        results = data.get("results", [])

        filtered_results = []
        for movie in results:
            movie_genres = [GENRE_MAP.get(genre_id, "Unknown") for genre_id in movie.get("genre_ids", [])]

            filtered_results.append({
                "title": movie.get("title", "Unknown Title"),
                "overview": movie.get("overview", "No overview available."),
                "release_date": movie.get("release_date", "N/A"),
                "poster_path": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}" if movie.get("poster_path") else None,
                "rating": round(float(movie.get("vote_average", 0) or 0), 2),
                "genres": movie_genres,  # Correctly mapped genre names
                "popularity": movie.get("popularity", 0),
                "vote_count": movie.get("vote_count", 0)
            })

        return {"results": filtered_results}

    return {"error": "Failed to fetch recommendations"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow requests from React frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)