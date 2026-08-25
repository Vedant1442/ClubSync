echo "Building..."
npm run build

echo "Zipping..."
Remove-Item -Path site.zip -Force -ErrorAction SilentlyContinue
Compress-Archive -Path dist\* -DestinationPath site.zip -Force

echo "Deploying..."
$headers = @{ "Authorization" = "Bearer nfc_pBJbinz7SCT8fK4zjdTq9pVQ1xh2nyjPfea4"; "Content-Type" = "application/zip" }
$r = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/9b4ae484-12dd-4f07-99b0-e97621309846/deploys" -Method Post -Headers $headers -InFile site.zip
echo "Result: $($r.state)"
