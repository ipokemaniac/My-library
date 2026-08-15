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
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');

// Process & Add ISBN
function processISBN(rawIsbn) {
  if (isProcessing) return;

  const cleanIsbn = rawIsbn.replace(/[^0-9X]/gi, '').toUpperCase();

  if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
    statusDiv.innerText = "Please enter a valid 10 or 13-digit ISBN.";
    return;
  }

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
    videoConstraints: { facingMode: "environment" }
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

// CSV Export Logic
exportBtn.addEventListener('click', () => {
  if (library.length === 0) {
    statusDiv.innerText = "Library is empty, nothing to export!";
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,ID,ISBN,Title,Author,Cover,AddedAt\r\n";
  
  library.forEach(book => {
    // Wrap fields in quotes to safely manage commas inside titles/authors
    const cleanTitle = `"${(book.title || "").replace(/"/g, '""')}"`;
    const cleanAuthor = `"${(book.author || "").replace(/"/g, '""')}"`;
    const row = [book.id, book.isbn, cleanTitle, cleanAuthor, book.cover, book.addedAt].join(",");
    csvContent += row + "\r\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `my_library_backup_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  statusDiv.innerText = "Library exported successfully as CSV!";
});

// CSV Import Logic
importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const text = event.target.result;
      const lines = text.split("\r\n").length > 1 ? text.split("\r\n") : text.split("\n");
      
      let importedCount = 0;
      
      // Skip header row (start at i = 1)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV cell splitter parsing commas and double quotes
        const row = [];
        let inQuotes = false;
        let currentField = '';
        
        for (let char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            row.push(currentField);
            currentField = '';
          } else {
            currentField += char;
          }
        }
        row.push(currentField);

        if (row.length >= 4) {
          const id = Number(row[0]) || Date.now();
          const isbn = row[1];
          const title = row[2] ? row[2].replace(/^"|"$/g, '').replace(/""/g, '"') : "Unknown Title";
          const author = row[3] ? row[3].replace(/^"|"$/g, '').replace(/""/g, '"') : "Unknown Author";
          const cover = row[4] || "https://via.placeholder.com/120x170?text=No+Cover";
          const addedAt = Number(row[5]) || new Date().getTime();

          // Avoid duplicates based on ISBN
          if (isbn && !library.some(b => b.isbn === isbn)) {
            library.push({ id, isbn, title, author, cover, addedAt });
            importedCount++;
          }
        }
      }

      saveAndRender();
      statusDiv.innerText = `Successfully imported ${importedCount} books from CSV backup!`;
    } catch (err) {
      console.error(err);
      statusDiv.innerText = "Error parsing CSV file. Please make sure it's a valid backup.";
    } finally {
      importFile.value = ''; // Reset file input
    }
  };
  reader.readAsText(file);
});

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
    libraryContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">No books added yet. Scan a barcode, enter an ISBN, or import a backup!</p>';
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
