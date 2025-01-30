import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Fetch search suggestions when typing
  useEffect(() => {
    if (query.length > 2) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/search/`, {
        params: { query },
      });

      const titles = response.data.results.map((movie) => movie.title);
      setSuggestions(titles.slice(0, 5)); // Limit to 5 suggestions
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const searchMovies = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setErrorMessage("");
    setMovies([]);
    setRecommendations([]);

    try {
      const response = await axios.get(`http://127.0.0.1:8000/search/`, {
        params: { query },
      });

      if (response.data.results.length === 0) {
        setErrorMessage("No results found. Try a different search.");
      } else {
        setMovies(response.data.results);
      }
    } catch (error) {
      setErrorMessage("Failed to fetch movie data. Please try again.");
    }

    setLoading(false);
  };

  const fetchRecommendations = async (movieId) => {
    if (!movieId) {
        console.error("Error: Movie ID is undefined!");
        return;
    }

    try {
      console.log(`Fetching recommendations for Movie ID: ${movieId}`);
      const response = await axios.get(`http://127.0.0.1:8000/recommendations/${movieId}`);

      console.log("Received recommendations:", response.data.results); // Debugging output

      setRecommendations(response.data.results);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
};

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Movie Search</h1>
      <div style={{ position: "relative", display: "inline-block" }}>
        <input
          type="text"
          placeholder="Search for a movie..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: "8px", width: "250px", marginRight: "10px" }}
        />
        <button onClick={searchMovies} style={{ padding: "8px 15px" }}>
          Search
        </button>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <ul
            style={{
              position: "absolute",
              background: "white",
              listStyle: "none",
              padding: "10px",
              width: "250px",
              textAlign: "left",
              border: "1px solid #ccc",
              marginTop: "5px",
            }}
          >
            {suggestions.map((title, index) => (
              <li
                key={index}
                style={{ padding: "5px", cursor: "pointer" }}
                onClick={() => {
                  setQuery(title);
                  setSuggestions([]);
                }}
              >
                {title}
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {errorMessage && <p style={{ color: "red", marginTop: "20px" }}>{errorMessage}</p>}

      <div style={{ marginTop: "20px" }}>
        {movies.map((movie) => (
          <div key={movie.id} style={{ marginBottom: "20px" }}>
            <h2 style={{ cursor: "pointer", color: "blue" }}  onClick={() => fetchRecommendations(movie.id)}>
              {movie.title}
            </h2>
            <p>{movie.overview}</p>
            {movie.poster_path && <img src={movie.poster_path} alt={movie.title} width="200px" />}
            <p><strong>Rating:</strong> {movie.rating}</p>
          </div>
        ))}
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div>
          <h2>Recommended Movies</h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
            {recommendations.map((movie) => (
              <div key={movie.title} style={{ margin: "20px", textAlign: "center", maxWidth: "300px" }}>
                <h3>{movie.title}</h3>
                
                {/* Display genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <p style={{ fontStyle: "italic", color: "gray" }}>Genres: {movie.genres.join(", ")}</p>
                )}

                <p>{movie.overview}</p>

                {movie.poster_path && <img src={movie.poster_path} alt={movie.title} width="150px" />}

                {/* Fix rating display */}
                <p><strong>Rating:</strong> {movie.rating !== undefined ? movie.rating.toFixed(2) : "N/A"}</p>
              </div>
            ))}
          </div>
        </div>
      )}



    </div>
  );
}

export default App;
