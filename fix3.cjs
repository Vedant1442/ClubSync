const fs = require('fs');
let c = fs.readFileSync('src/context/ClubSyncContext.jsx', 'utf8');

c = c.replace(/fetch\(\`\$\{API_URL\}\/api(.*?)\', \{/g, 'fetch(`${API_URL}/api$1`, {');

fs.writeFileSync('src/context/ClubSyncContext.jsx', c);
