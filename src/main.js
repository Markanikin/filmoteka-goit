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
const loaderWrapper = document.getElementById('loader-wrapper');

// === Глобальні змінні ===
let currentQuery = DEFAULT_QUERY;
let paginationInstance = null;
let loaderStartTime = 0;

// === Показати/сховати лоадер ===
function showLoader() {
  loaderStartTime = Date.now();
  loaderWrapper.style.display = 'flex';
  results.innerHTML = '';
  paginationContainer.innerHTML = '';
}

function hideLoader(callback) {
  const elapsedTime = Date.now() - loaderStartTime;
  const remainingTime = Math.max(0, 2000 - elapsedTime);
  
  setTimeout(() => {
    loaderWrapper.style.display = 'none';
    if (callback) callback();
  }, remainingTime);
}

// === Ініціалізація пагінації ===
function initPagination(totalItems, currentPage = 1) {
  if (paginationContainer) {
    paginationContainer.innerHTML = '';
  }

  if (paginationInstance) {
    paginationInstance.reset();
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
  showLoader();
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
        hideLoader(() => {
          results.innerHTML = '<p>No movies found</p>';
        });
      }
    })
    .catch(() => {
      hideLoader(() => {
        results.innerHTML = '<p>Error loading movies</p>';
      });
    });
}

// === Відображення фільмів за imdbID ===
function displayMoviesByIds(imdbIds) {
  if (imdbIds.length === 0) {
    hideLoader(() => {
      results.innerHTML = '<p>No movies found</p>';
    });
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
        hideLoader(() => {
          results.innerHTML = '<p>No movies match the rating filter</p>';
        });
        return;
      }
      
      const moviesHTML = filtered
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
      
      hideLoader(() => {
        results.innerHTML = moviesHTML;
      });
    })
    .catch(() => {
      hideLoader(() => {
        results.innerHTML = '<p>Error loading movies</p>';
      });
    });
}

// === Пошук або завантаження за замовчуванням ===
function handleSearch(query) {
  currentQuery = query.trim() || DEFAULT_QUERY;
  showLoader();
  
  fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(currentQuery)}&apikey=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.Response === 'True') {
        const ids = data.Search.map(m => m.imdbID);
        displayMoviesByIds(ids);
        const total = parseInt(data.totalResults);
        hideLoader(() => {
          initPagination(total, 1);
        });
      } else {
        hideLoader(() => {
          results.innerHTML = '<p>No movies found</p>';
          if (paginationContainer) paginationContainer.innerHTML = '';
        });
      }
    })
    .catch(() => {
      hideLoader(() => {
        results.innerHTML = '<p>Error loading movies</p>';
      });
    });
}

// === Події ===
button.addEventListener('click', () => handleSearch(input.value));
input.addEventListener('keypress', e => {
  if (e.key === 'Enter') handleSearch(input.value);
});
ratingFilter.addEventListener('change', () => {
  handleSearch(currentQuery);
});

// === Початкове завантаження з лоадером ===
showLoader();
fetch(`https://www.omdbapi.com/?s=${DEFAULT_QUERY}&apikey=${API_KEY}`)
  .then(response => response.json())
  .then(data => {
    if (data.Response === 'True') {
      const ids = data.Search.map(m => m.imdbID);
      displayMoviesByIds(ids);
      const total = parseInt(data.totalResults);
      hideLoader(() => {
        initPagination(total, 1);
      });
    } else {
      hideLoader(() => {
        results.innerHTML = '<p>No movies found</p>';
      });
    }
  })
  .catch(() => {
    hideLoader(() => {
      results.innerHTML = '<p>Error loading default movies</p>';
    });
  });