const API_KEY = '9e8f1a2';
const input = document.getElementById('search');
const button = document.getElementById('searchBtn');
const results = document.getElementById('results');

function searchMovies(query) {
  if (query === '') {
    results.innerHTML = '';
    return;
  }

  fetch(
    `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${API_KEY}`
  )
    .then(response => response.json())
    .then(data => {
      if (data.Response === 'True') {
        const movies = data.Search.slice(0, 12);

        const detailPromises = movies.map(movie =>
          fetch(
            `https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API_KEY}`
          ).then(res => res.json())
        );

        Promise.all(detailPromises).then(fullMovies => {
          results.innerHTML = fullMovies
            .map(
              movie => `
              <div class="movie-card">
                <img src="${
                  movie.Poster === 'N/A'
                    ? 'https://via.placeholder.com/300?text=No+Poster'
                    : movie.Poster
                }"/>
                <div class="info">
                  <h3>${movie.Title} (${movie.Year})</h3>
                  <p>Director:${movie.Director}</p>
                  <p>Actors:${movie.Actors}</p>
                  <p>IMDb: ${movie.imdbRating || 'N/A'}</p>
                  <p class="plot">${movie.Plot}</p>
                </div>
              </div>
            `
            )
            .join('');
        });
      } else {
        results.innerHTML = '<p>No movies found</p>';
      }
    })
    .catch(() => {
      results.innerHTML = '<p>Error loading movies</p>';
    });
}

button.addEventListener('click', () => searchMovies(input.value));
input.addEventListener('keypress', e => {
  if (e.key === 'Enter') searchMovies(input.value);
});
