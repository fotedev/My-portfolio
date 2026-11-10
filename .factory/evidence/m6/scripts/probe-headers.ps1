# M6 security audit - Check 1: security headers on GET (passive)
$ErrorActionPreference = "Continue"
Write-Output ("RUN_UTC: " + (Get-Date).ToUniversalTime().ToString("o"))
$urls = @(
  "https://fotedev.me/en",
  "https://fotedev.me/ar",
  "https://fotedev.me/en/contact",
  "https://fotedev.me/admin/login",
  "https://fotedev.me/admin"
)
foreach ($u in $urls) {
  Write-Output ""
  Write-Output ("===== GET " + $u + " =====")
  $h = curl.exe -s -S -D - -o NUL -w "CURL_STATUS:%{http_code}\nCURL_REDIRECT_URL:%{redirect_url}\n" $u
  Write-Output $h
}
Write-Output ""
Write-Output "END_HEADERS_PROBE"
