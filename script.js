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

// Enhanced Fetch Book Metadata with Fallbacks
async function fetchBookDetails(isbn) {
  let title = null;
  let author = null;
  let cover = "https://via.placeholder.com/120x170?text=No+Cover";

  try {
    // Attempt 1: Standard Books API Endpoint
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    const data = await response.json();
    const bookKey = `ISBN:${isbn}`;

    if (data[bookKey]) {
      const bookData = data[bookKey];
      title = bookData.title || null;
      author = bookData.authors ? bookData.authors.map(a => a.name).join(", ") : null;
      if (bookData.cover && bookData.cover.medium) {
        cover = bookData.cover.medium;
      }
    }

    // Attempt 2: Fallback to ISBN Endpoint if metadata is missing or empty
    if (!title) {
      const altResponse = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
      if (altResponse.ok) {
        const altData = await altResponse.json();
        title = altData.title || null;

        // Fetch author names if author keys are provided
        if (altData.authors && altData.authors.length > 0) {
          const authorNames = [];
          for (let authObj of altData.authors) {
            try {
              const authorRes = await fetch(`https://openlibrary.org${authObj.key}.json`);
              if (authorRes.ok) {
                const authorData = await authorRes.json();
                if (authorData.name) authorNames.push(authorData.name);
              }
            } catch (err) {
              // Ignore individual author fetch failures
            }
          }
          if (authorNames.length > 0) {
            author = authorNames.join(", ");
          }
        }
      }
    }

    // Attempt 3: Fallback via Covers API image validation
    if (cover.includes("No+Cover")) {
      cover = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    }

    // Final Validation and Insertion
    const finalTitle = title || `Unknown Book (${isbn})`;
    const finalAuthor = author || "Unknown Author";

    const newBook = {
      id: Date.now(),
      isbn: isbn,
      title: finalTitle,
      author: finalAuthor,
      cover: cover,
      addedAt: new Date().getTime()
    };

    library.push(newBook);
    saveAndRender();
    
    if (!title) {
      statusDiv.innerText = `Saved ISBN ${isbn}, but details were sparse on Open Library.`;
    } else {
      statusDiv.innerText = `Successfully added "${finalTitle}"!`;
    }

  } catch (err) {
    console.error(err);
    // Fallback save so user doesn't lose the scan on network exceptions
    library.push({
      id: Date.now(),
      isbn: isbn,
      title: `Unknown Book (${isbn})`,
      author: "Unknown Author",
      cover: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
      addedAt: new Date().getTime()
    });
    saveAndRender();
    statusDiv.innerText = "Error fetching book data. Entry saved with fallback settings.";
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
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

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
      importFile.value = '';
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
