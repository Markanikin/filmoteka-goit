const API_KEY = '9e8f1a2';
const input = document.getElementById('search');
const button = document.getElementById('searchBtn');
const results = document.getElementById('results');

const TOP_MOVIES = [
  'tt15398776',
  'tt6710474',
  'tt1877830',
  'tt13320622',
  'tt10366206',
  'tt1630029',
  'tt14209916',
  'tt15671028',
  'tt13238346',
  'tt11358390',
  'tt10298810',
  'tt10151854',
];

function displayMoviesByIds(imdbIds) {
  if (imdbIds.length === 0) {
    results.innerHTML = '<p>No movies found</p>';
    return;
  }

  const promises = imdbIds.map(id =>
    fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`).then(response =>
      response.json()
    )
  );

  Promise.all(promises)
    .then(fullMovies => {
      results.innerHTML = fullMovies
        .map(
          movie => `
            <div class="movie-card">
              <img src="${
                movie.Poster === 'N/A'
                  ? 'https://via.placeholder.com/200x300?text=No+Poster'
                  : movie.Poster
              }" />
              <div class="movie-info">
                <h3>${movie.Title} (${movie.Year})</h3>
                <p>Director: ${movie.Director}</p>
                <p>Actors: ${movie.Actors}</p>
                <p>IMDb: ${movie.imdbRating || 'N/A'}</p>
                <p>${movie.Plot || 'No description'}</p>
              </div>
            </div>
          `
        )
        .join('');
    })
    .catch(() => {
      results.innerHTML = '<p>Error loading movies</p>';
    });
}

function searchMovies(query) {
  if (query === '') {
    displayMoviesByIds(TOP_MOVIES);
    return;
  }

  fetch(
    `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${API_KEY}`
  )
    .then(response => response.json())
    .then(data => {
      if (data.Response === 'True') {
        const ids = data.Search.slice(0, 12).map(m => m.imdbID);
        displayMoviesByIds(ids);
      } else {
        results.innerHTML = '<p>No movies found</p>';
      }
    })
    .catch(() => {
      results.innerHTML = '<p>Error loading movies</p>';
    });
}

displayMoviesByIds(TOP_MOVIES);

button.addEventListener('click', () => searchMovies(input.value));
input.addEventListener('keypress', e => {
  if (e.key === 'Enter') searchMovies(input.value);
});
