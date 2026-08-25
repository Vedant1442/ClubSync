const fs = require('fs');
let c = fs.readFileSync('src/context/ClubSyncContext.jsx', 'utf8');

c = c.replace(/fetch\(\'\\\/api/g, 'fetch(`${API_URL}/api');
c = c.replace(/fetch\(\`\\\/api/g, 'fetch(`${API_URL}/api');

fs.writeFileSync('src/context/ClubSyncContext.jsx', c);
