$env:NETLIFY_AUTH_TOKEN="nfc_pBJbinz7SCT8fK4zjdTq9pVQ1xh2nyjPfea4"
$siteId = "df4b3be7-8096-48df-8fd6-1468d2a25106"

echo "Setting URL..."
npx netlify-cli env:set VITE_SUPABASE_URL https://hfstigsizzkozpoojfia.supabase.co --site $siteId

echo "Setting Key..."
npx netlify-cli env:set VITE_SUPABASE_ANON_KEY eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmc3RpZ3Npenprb3pwb29qZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDc4NzQsImV4cCI6MjA5NDUyMzg3NH0.g9eoR_5Ipf5hzHAd12iOlD95VfssaH2WPOznaLcuwdA --site $siteId

echo "Building..."
npm run build

echo "Deploying..."
npx netlify-cli deploy --prod --dir=dist --site $siteId
