// Theme Initialization
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('library_theme') || 'light';

if (currentTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  themeToggle.innerText = '☀️ Light Mode';
}

themeToggle.addEventListener('click', () => {
  let theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('library_theme', 'light');
    themeToggle.innerText = '🌙 Dark Mode';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('library_theme', 'dark');
    themeToggle.innerText = '☀️ Light Mode';
  }
});

// State management
let library = JSON.parse(localStorage.getItem('my_library')) || [];
let currentView = 'grid';
let currentSort = 'last-added';
let isProcessing = false;

// Elements
const libraryContainer = document.getElementById('library');
const sortSelect = document.getElementById('sort-select');
const viewGridBtn = document.getElementById('view-grid-btn');
const viewListBtn = document.getElementById('view-list-btn');
const statusDiv = document.getElementById('status');
const manualForm = document.getElementById('manual-isbn-form');
const manualInput = document.getElementById('manual-isbn-input');

// Process & Add ISBN
function processISBN(rawIsbn) {
  if (isProcessing) return;

  // Clean non-numeric characters (except 'X' for ISBN-10)
  const cleanIsbn = rawIsbn.replace(/[^0-9X]/gi, '').toUpperCase();

  if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
    statusDiv.innerText = "Please enter a valid 10 or 13-digit ISBN.";
    return;
  }

  // Check for duplicates
  if (library.some(book => book.isbn === cleanIsbn)) {
    statusDiv.innerText = `Book (ISBN: ${cleanIsbn}) is already in your library!`;
    return;
  }

  isProcessing = true;
  statusDiv.innerText = `Processing ISBN: ${cleanIsbn}. Fetching details...`;

  fetchBookDetails(cleanIsbn);
}

// Setup Barcode Scanner - FORCED BACK CAMERA
function onScanSuccess(decodedText) {
  processISBN(decodedText);
}

const html5QrcodeScanner = new Html5QrcodeScanner(
  "reader", 
  { 
    fps: 10, 
    qrbox: { width: 250, height: 150 }, 
    formatsToSupport: [ Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8 ],
    videoConstraints: { facingMode: "environment" } // Forces back camera on phones
  },
  /* verbose= */ false
);
html5QrcodeScanner.render(onScanSuccess);

// Manual Input Handler
manualForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const isbnValue = manualInput.value.trim();
  if (isbnValue) {
    processISBN(isbnValue);
    manualInput.value = '';
  }
});

// Fetch Book Metadata from Open Library API
async function fetchBookDetails(isbn) {
  try {
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    const data = await response.json();
    const bookKey = `ISBN:${isbn}`;

    if (data[bookKey]) {
      const bookData = data[bookKey];
      const newBook = {
        id: Date.now(),
        isbn: isbn,
        title: bookData.title || "Unknown Title",
        author: bookData.authors ? bookData.authors.map(a => a.name).join(", ") : "Unknown Author",
        cover: bookData.cover ? bookData.cover.medium : "https://via.placeholder.com/120x170?text=No+Cover",
        addedAt: new Date().getTime()
      };

      library.push(newBook);
      saveAndRender();
      statusDiv.innerText = `Successfully added "${newBook.title}"!`;
    } else {
      statusDiv.innerText = `Book info not found for ISBN ${isbn}, but saved entry.`;
      library.push({
        id: Date.now(),
        isbn: isbn,
        title: `Unknown Book (${isbn})`,
        author: "Unknown",
        cover: "https://via.placeholder.com/120x170?text=No+Cover",
        addedAt: new Date().getTime()
      });
      saveAndRender();
    }
  } catch (err) {
    console.error(err);
    statusDiv.innerText = "Error fetching book data. Check your network connection.";
  } finally {
    setTimeout(() => {
      isProcessing = false;
      statusDiv.innerText = "Ready to scan or enter next book...";
    }, 2000);
  }
}

// Storage & Rendering
function saveAndRender() {
  localStorage.setItem('my_library', JSON.stringify(library));
  renderLibrary();
}

function deleteBook(id) {
  library = library.filter(book => book.id !== id);
  saveAndRender();
}

function getSortedBooks() {
  const booksCopy = [...library];
  switch (currentSort) {
    case 'first-added':
      return booksCopy.sort((a, b) => a.addedAt - b.addedAt);
    case 'last-added':
      return booksCopy.sort((a, b) => b.addedAt - a.addedAt);
    case 'a-z':
      return booksCopy.sort((a, b) => a.title.localeCompare(b.title));
    case 'z-a':
      return booksCopy.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return booksCopy;
  }
}

function renderLibrary() {
  libraryContainer.className = `library-container ${currentView}`;
  libraryContainer.innerHTML = '';

  const sortedBooks = getSortedBooks();

  if (sortedBooks.length === 0) {
    libraryContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">No books added yet. Scan a barcode or enter an ISBN above!</p>';
    return;
  }

  sortedBooks.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';

    card.innerHTML = `
      <img src="${book.cover}" alt="${book.title} cover" onerror="this.src='https://via.placeholder.com/120x170?text=No+Cover'">
      <div class="book-info">
        <div class="book-title">${book.title}</div>
        <div class="book-author">${book.author}</div>
        <div class="isbn-tag">ISBN: ${book.isbn}</div>
      </div>
      <button class="delete-btn" onclick="deleteBook(${book.id})">Remove</button>
    `;

    libraryContainer.appendChild(card);
  });
}

// Event Listeners
sortSelect.addEventListener('change', (e) => {
  currentSort = e.target.value;
  renderLibrary();
});

viewGridBtn.addEventListener('click', () => {
  currentView = 'grid';
  viewGridBtn.classList.add('active');
  viewListBtn.classList.remove('active');
  renderLibrary();
});

viewListBtn.addEventListener('click', () => {
  currentView = 'list';
  viewListBtn.classList.add('active');
  viewGridBtn.classList.remove('active');
  renderLibrary();
});

// Initial load
renderLibrary();
