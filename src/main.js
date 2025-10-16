// === Імпорти (Vite + npm) ===
import Pagination from 'tui-pagination';

// === Конфігурація ===
const API_KEY = '9e8f1a2';
const DEFAULT_QUERY = 'movie'; // запит за замовчуванням

// === DOM елементи ===
const input = document.getElementById('search');
const button = document.getElementById('searchBtn');
const ratingFilter = document.getElementById('ratingFilter');
const results = document.getElementById('results');
const paginationContainer = document.getElementById('pagination');

// === Глобальні змінні ===
let currentQuery = DEFAULT_QUERY;
let paginationInstance = null;

// === Ініціалізація пагінації ===
function initPagination(totalItems, currentPage = 1) {
  if (paginationContainer) {
    paginationContainer.innerHTML = '';
  }

  paginationInstance = new Pagination(paginationContainer, {
    totalItems: Math.min(totalItems, 100),
    itemsPerPage: 10,
    visiblePages: 5,
    page: currentPage,
    centerAlign: true,
  });

  paginationInstance.on('afterMove', event => {
    loadMoviesPage(currentQuery, event.page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// === Завантаження сторінки фільмів ===
function loadMoviesPage(query, page) {
  fetch(
    `https://www.omdbapi.com/?s=${encodeURIComponent(
      query
    )}&page=${page}&apikey=${API_KEY}`
  )
    .then(response => response.json())
    .then(data => {
      if (data.Response === 'True') {
        const ids = data.Search.map(m => m.imdbID);
        displayMoviesByIds(ids);
      } else {
        results.innerHTML = '<p>No movies found</p>';
      }
    })
    .catch(() => {
      results.innerHTML = '<p>Error loading movies</p>';
    });
}

// === Відображення фільмів за imdbID ===
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
      const minRating = parseFloat(ratingFilter.value);
      let filtered = fullMovies;
      if (!isNaN(minRating)) {
        filtered = fullMovies.filter(movie => {
          const r = parseFloat(movie.imdbRating);
          return !isNaN(r) && r >= minRating;
        });
      }
      if (filtered.length === 0) {
        results.innerHTML = '<p>No movies match the rating filter</p>';
        return;
      }
      results.innerHTML = filtered
        .map(
          movie => `
        <div class="movie-card">
          <img src="${
            movie.Poster === 'N/A'
              ? 'https://via.placeholder.com/300x420?text=No+Poster'
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

// === Пошук або завантаження за замовчуванням ===
function handleSearch(query) {
  currentQuery = query.trim() || DEFAULT_QUERY;
  loadMoviesPage(currentQuery, 1);
}

// === Події ===
button.addEventListener('click', () => handleSearch(input.value));
input.addEventListener('keypress', e => {
  if (e.key === 'Enter') handleSearch(input.value);
});
ratingFilter.addEventListener('change', () => {
  handleSearch(currentQuery);
});

// === Початкове завантаження (за замовчуванням) ===
fetch(`https://www.omdbapi.com/?s=${DEFAULT_QUERY}&apikey=${API_KEY}`)
  .then(response => response.json())
  .then(data => {
    if (data.Response === 'True') {
      const ids = data.Search.map(m => m.imdbID);
      displayMoviesByIds(ids);
      const total = parseInt(data.totalResults);
      initPagination(total, 1);
    } else {
      results.innerHTML = '<p>No movies found</p>';
    }
  })
  .catch(() => {
    results.innerHTML = '<p>Error loading default movies</p>';
  });
// === Пошук фільмів ===
function searchMovies(query) {
  currentQuery = query;
  if (query === '') {
    displayMoviesByIds(TOP_MOVIES);
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }
  fetch(
    `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${API_KEY}`
  )
    .then(response => response.json())
    .then(data => {
      if (data.Response === 'True') {
        const ids = data.Search.map(m => m.imdbID);
        displayMoviesByIds(ids);
        const total = Math.min(parseInt(data.totalResults), 100);
        initPagination(total, 1);
      } else {
        results.innerHTML = '<p>No movies found</p>';
        if (paginationContainer) paginationContainer.innerHTML = '';
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
ratingFilter.addEventListener('change', () => {
  if (currentQuery === '') {
    displayMoviesByIds(TOP_MOVIES);
  } else {
    searchMovies(currentQuery);
  }
});

displayMoviesByIds(TOP_MOVIES);
