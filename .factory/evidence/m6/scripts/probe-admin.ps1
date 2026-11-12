# M6 security audit - Check 2: unauthenticated admin surface (passive)
$ErrorActionPreference = "Continue"
Write-Output ("RUN_UTC: " + (Get-Date).ToUniversalTime().ToString("o"))
$urls = @(
  "https://fotedev.me/admin",
  "https://fotedev.me/admin/inquiries",
  "https://fotedev.me/admin/projects",
  "https://fotedev.me/admin/settings"
)
foreach ($u in $urls) {
  Write-Output ""
  Write-Output ("===== GET " + $u + " (unauthenticated) =====")
  $tmp = Join-Path $env:TEMP ("adminbody_" + [guid]::NewGuid().ToString("N") + ".txt")
  $h = curl.exe -s -S -D - -o $tmp -w "CURL_STATUS:%{http_code}\nCURL_REDIRECT_URL:%{redirect_url}\n" $u
  $h | Select-String -Pattern "^HTTP/|location:|x-matched-path:" | ForEach-Object { $_.Line }
  $b = ""
  if (Test-Path $tmp) { $b = [System.IO.File]::ReadAllText($tmp) }
  Write-Output ("BODY_CHARS:" + $b.Length)
  $patterns = @("(?i)inquir", "(?i)dashboard", "(?i)supabase", "(?i)logout", "(?i)<table", "(?i)<td", "(?i)service_role", "(?i)apikey", "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
  $total = 0
  foreach ($p in $patterns) {
    $c = ([regex]::Matches($b, $p)).Count
    if ($c -gt 0) { Write-Output ("LEAK_PATTERN " + $p + " HITS:" + $c) }
    $total += $c
  }
  Write-Output ("LEAK_TOTAL_HITS:" + $total)
  if ($b.Length -gt 0) {
    $flat = ($b -replace "\s+", " ").Trim()
    Write-Output ("BODY_SNIPPET(first 300):" + $flat.Substring(0, [Math]::Min(300, $flat.Length)))
  }
}
Write-Output ""
Write-Output "END_ADMIN_PROBE"
