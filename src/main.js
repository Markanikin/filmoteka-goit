import Pagination from 'tui-pagination';

const API_KEY = '154a9aaa';
const DEFAULT_QUERY = 'movie';

const input = document.getElementById('search');
const button = document.getElementById('searchBtn');
const ratingFilter = document.getElementById('ratingFilter');
const results = document.getElementById('results');
const paginationContainer = document.getElementById('pagination');
const loaderWrapper = document.getElementById('loader-wrapper');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartItems = document.getElementById('cart-items');
const cartIcon = document.getElementById('cart');

let currentQuery = DEFAULT_QUERY;
let paginationInstance = null;
let loaderStartTime = 0;
let cart = JSON.parse(localStorage.getItem('filmCart')) || [];
let currentMovies = [];

function updateCartCount() {
  cartCount.textContent = cart.length;
  cartCount.style.display = cart.length > 0 ? 'flex' : 'none';
  localStorage.setItem('filmCart', JSON.stringify(cart));
}

function addToCart(imdbID) {
  const movie = currentMovies.find(m => m.imdbID === imdbID);
  if (!movie) return;
  
  const exists = cart.find(item => item.imdbID === imdbID);
  if (!exists) {
    cart.push({
      imdbID: movie.imdbID,
      Title: movie.Title,
      Year: movie.Year,
      Poster: movie.Poster
    });
    updateCartCount();
    showNotification(`${movie.Title} added to cart!`);
  } else {
    showNotification(`${movie.Title} is already in cart!`);
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

function removeFromCart(imdbID) {
  cart = cart.filter(item => item.imdbID !== imdbID);
  updateCartCount();
  renderCart();
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    return;
  }

  cartItems.innerHTML = cart
    .map(
      movie => `
    <div class="cart-item">
      <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/60x90?text=No+Poster'}" alt="${movie.Title}">
      <div class="cart-item-details">
        <strong>${movie.Title}</strong>
        <span class="cart-year">(${movie.Year})</span>
      </div>
      <button class="remove-btn" onclick="removeFromCartById('${movie.imdbID}')">×</button>
    </div>
  `
    )
    .join('');
}

window.removeFromCartById = removeFromCart;
window.addToCartById = addToCart;

function showLoader() {
  loaderStartTime = Date.now();
  loaderWrapper.style.display = 'flex';
  results.innerHTML = '';
  paginationContainer.style.opacity = '0';
}

function hideLoader(callback) {
  const elapsedTime = Date.now() - loaderStartTime;
  const remainingTime = Math.max(0, 2000 - elapsedTime);

  setTimeout(() => {
    loaderWrapper.style.display = 'none';
    paginationContainer.style.opacity = '1';
    paginationContainer.style.pointerEvents = 'auto';
    if (callback) callback();
  }, remainingTime);
}

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

function loadMoviesPage(query, page) {
  showLoader();
  fetch(
    `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&page=${page}&apikey=${API_KEY}`
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
      currentMovies = fullMovies;
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
    }" alt="${movie.Title}" />
    <div class="movie-info">
      <h3>${movie.Title} <span class="year">(${movie.Year})</span></h3>
      <p><strong>Director:</strong> ${movie.Director}</p>
      <p><strong>Actors:</strong> ${movie.Actors}</p>
      <p class="rating"><strong>IMDb:</strong> <span class="rating-badge">${movie.imdbRating || 'N/A'}</span></p>
      <p class="plot">${movie.Plot || 'No description'}</p>
      <div class="movie-buttons">
        <button class="add-to-cart-btn" onclick="addToCartById('${movie.imdbID}')">
          <span>🛒</span> Add to Cart
        </button>
        <a href="https://www.amazon.com/s?k=${encodeURIComponent(movie.Title + ' ' + movie.Year + ' DVD')}" target="_blank" class="buy-now-btn">
          <span>🔥</span> Buy Now
        </a>
      </div>
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

function handleSearch(query) {
  currentQuery = query.trim() || DEFAULT_QUERY;
  showLoader();

  fetch(
    `https://www.omdbapi.com/?s=${encodeURIComponent(currentQuery)}&apikey=${API_KEY}`
  )
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

button.addEventListener('click', () => handleSearch(input.value));
input.addEventListener('keypress', e => {
  if (e.key === 'Enter') handleSearch(input.value);
});
ratingFilter.addEventListener('change', () => {
  handleSearch(currentQuery);
});

cartIcon.addEventListener('click', () => {
  renderCart();
  cartModal.style.display = 'flex';
});

document.getElementById('close-cart').addEventListener('click', () => {
  cartModal.style.display = 'none';
});

document.getElementById('buy-now').addEventListener('click', () => {
  if (cart.length === 0) {
    showNotification('Your cart is empty!');
    return;
  }
  showNotification(`Thank you! You've bought ${cart.length} movies!`);
  cart = [];
  updateCartCount();
  cartModal.style.display = 'none';
});

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
updateCartCount();