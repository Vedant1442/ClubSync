const fs = require('fs');
let c = fs.readFileSync('src/context/ClubSyncContext.jsx', 'utf8');

c = c.replace(/fetch\('http:\/\/localhost:5000/g, 'fetch(`${API_URL}');
c = c.replace(/fetch\(`http:\/\/localhost:5000/g, 'fetch(`${API_URL}');

c = `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';\n` + c;

fs.writeFileSync('src/context/ClubSyncContext.jsx', c);
