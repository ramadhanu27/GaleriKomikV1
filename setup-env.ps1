# PowerShell script to create .env.local file
$envContent = @"
SUPABASE_URL=https://huhhzvaiqskhldhxexcu.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aGh6dmFpcXNraGxkaHhleGN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5NDQxOCwiZXhwIjoyMDc2MjcwNDE4fQ.OdYbHT0jY2oWkKGufOnJb0uiZDAX-jO9kWMHx02uW94
SUPABASE_BUCKET=komiku-data

NEXT_PUBLIC_SUPABASE_URL=https://huhhzvaiqskhldhxexcu.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aGh6dmFpcXNraGxkaHhleGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTQ0MTgsImV4cCI6MjA3NjI3MDQxOH0.thb-ZhcqF7_gamR8t6aANAWTbeqTnKR7sk7qRmO8ut4
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8 -NoNewline

Write-Host "✅ File .env.local berhasil dibuat!" -ForegroundColor Green
Write-Host "Sekarang jalankan: npm install" -ForegroundColor Yellow
