
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const drawer = document.querySelector('.drawer');
    let drawerTimeout;

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            drawer.classList.toggle('open');

            // Clear any existing timer
            clearTimeout(drawerTimeout);

            // If the drawer is open, set a timer to close it
            if (drawer.classList.contains('open')) {
                drawerTimeout = setTimeout(() => {
                    drawer.classList.remove('open');
                }, 3000); // 3000 milliseconds = 3 seconds
            }
        });
    }

    const introImages = document.querySelectorAll('.intro-images img');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.5
    });

    introImages.forEach(img => {
        observer.observe(img);
    });

    const chatElements = document.querySelectorAll('.chat1, .chat2, .chat3');
    chatElements.forEach(el => {
        observer.observe(el);
    });


    const sheetId = '1WWipqOsFrscrngCbqn1L_LZdwLL6rZIrM-XSjOiO_j4';
    const sheetName = 'rules';
    const rulesContent = document.querySelector('.rules-content');

    function fetchRules() {
        if (rulesContent) {
            fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`)
                .then(response => response.text())
                .then(csvText => {
                    rulesContent.innerHTML = ''; // Clear existing rules
                    const rows = csvText.split('\n').map(row => row.replace(/"/g, ''));
                    rows.shift(); // Remove header row
                    rows.forEach(row => {
                        if (row.trim() !== '') {
                            const p = document.createElement('li');
                            p.textContent = row;
                            rulesContent.appendChild(p);
                        }
                    });
                })
                .catch(error => {
                    console.error('Error fetching Google Sheet data:', error);
                    rulesContent.textContent = 'Failed to load rules. Please try again later.';
                });
        }
    }

    if (rulesContent) {
        fetchRules(); // Initial fetch
        setInterval(fetchRules, 5000); // Refresh every 5 seconds
    }

    // -----------------------------
    // Fetch and render 'momaiz' entries
    // -----------------------------
    const momaizSheetName = 'momaiz';
    const contentEl = document.querySelector('.content');
    const defaultImage = 'danialLogo-BG.png';

    function resolveDriveLink(link) {
        if (!link || link.trim() === '') return defaultImage;
        // If user already provided a direct image URL, return as-is
        if (!link.includes('drive.google.com')) return link;

        // drive patterns: https://drive.google.com/file/d/FILEID/view?usp=sharing
        let m = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;

        // id=FILEID pattern
        m = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;

        // fallback: try to extract a long-ish token
        m = link.match(/[-_a-zA-Z0-9]{20,}/);
        if (m) return `https://drive.google.com/uc?export=view&id=${m[0]}`;

        return defaultImage;
    }

    function renderMomaiz(items) {
        if (!contentEl) return;
        contentEl.innerHTML = ''; // clear existing

        const grid = document.createElement('div');
        grid.className = 'momaiz-grid';

        items.forEach(({ image, name }) => {
            const item = document.createElement('div');
            item.className = 'momaiz-item';

            const img = document.createElement('img');
            img.className = 'momaiz-img';
            img.src = resolveDriveLink(image);
            img.alt = name || 'momaiz image';
            img.onerror = () => { img.src = defaultImage; };

            const caption = document.createElement('div');
            caption.className = 'momaiz-caption';
            caption.textContent = name || '';

            item.appendChild(img);
            item.appendChild(caption);
            grid.appendChild(item);
        });

        contentEl.appendChild(grid);
    }

    function fetchMomaiz() {
        if (!contentEl) return;
        fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${momaizSheetName}`)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split('\n').map(r => r.replace(/"/g, ''));
                if (rows.length <= 1) {
                    renderMomaiz([]);
                    return;
                }
                rows.shift(); // remove header
                const items = [];
                rows.forEach(row => {
                    if (row.trim() === '') return;
                    // split only on the first comma to allow commas in the name
                    const firstComma = row.indexOf(',');
                    let image = '';
                    let name = '';
                    if (firstComma === -1) {
                        image = row.trim();
                    } else {
                        image = row.slice(0, firstComma).trim();
                        name = row.slice(firstComma + 1).trim();
                    }
                    items.push({ image, name });
                });
                renderMomaiz(items);
            })
            .catch(err => {
                console.error('Error fetching momaiz sheet:', err);
                contentEl.textContent = 'Failed to load items.';
            });
    }

    if (contentEl) {
        fetchMomaiz();
        setInterval(fetchMomaiz, 10000); // refresh every 10s
    }

    // -----------------------------
    // Fetch and render 'rank' sheet into a table (merged from rank.js)
    // -----------------------------
    const rankTable = document.querySelector('.rank-table');
    if (rankTable) {
        const thead = rankTable.querySelector('thead');
        const tbody = rankTable.querySelector('tbody');

        function clearRankTable() {
            if (thead) thead.innerHTML = '';
            if (tbody) tbody.innerHTML = '';
        }

        function parseCsv(csvText) {
            const rows = csvText.split('\n').map(r => r.replace(/"/g, ''));
            return rows.map(r => r.split(','));
        }

        function renderRankTable(rows) {
            clearRankTable();
            if (!rows || rows.length === 0) {
                if (tbody) tbody.innerHTML = '<tr><td>No data</td></tr>';
                return;
            }

            // Header
            const headerRow = rows[0];
            const trHead = document.createElement('tr');
            headerRow.forEach(cell => {
                const th = document.createElement('th');
                th.textContent = cell;
                trHead.appendChild(th);
            });
            if (thead) thead.appendChild(trHead);

            // Body rows
            rows.slice(1).forEach(r => {
                if (r.join('').trim() === '') return;
                const tr = document.createElement('tr');
                r.forEach(cell => {
                    const td = document.createElement('td');
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                if (tbody) tbody.appendChild(tr);
            });
        }

        function fetchRank() {
            const rankSheetName = 'rank';
            fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${rankSheetName}`)
                .then(r => r.text())
                .then(csvText => {
                    const rows = parseCsv(csvText);
                    renderRankTable(rows);
                })
                .catch(err => {
                    console.error('Error fetching rank sheet:', err);
                    clearRankTable();
                    if (tbody) tbody.innerHTML = '<tr><td>Failed to load data. Check console for details.</td></tr>';
                });
        }

        // Initial load and refresh
        fetchRank();
        setInterval(fetchRank, 15000);
    }

});
