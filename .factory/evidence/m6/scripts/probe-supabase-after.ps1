# M6 security audit - Check 3 (AFTER count). Secrets stay in process memory, never printed.
$ErrorActionPreference = "Continue"
Write-Output ("RUN_UTC: " + (Get-Date).ToUniversalTime().ToString("o"))
$envPath = "C:\programming\github\My-Portfolio\.env.local"
$lines = Get-Content $envPath
$sLine = $lines | Where-Object { $_ -match "^\s*(export\s+)?SUPABASE_SERVICE_ROLE_KEY\s*=" } | Select-Object -First 1
if (-not $sLine) { Write-Output "ABORT: SUPABASE_SERVICE_ROLE_KEY missing in .env.local"; exit 1 }
$svc = ($sLine -replace "^\s*(export\s+)?SUPABASE_SERVICE_ROLE_KEY\s*=\s*", "").Trim().Trim('"').Trim("'")
$rest = "https://zfhfeiqdsugjqliufhke.supabase.co/rest/v1/inquiries"
$script:lastCR = ""
function Get-InquiryCount {
  $h = curl.exe -s -I -H "apikey: $svc" -H "Authorization: Bearer $svc" -H "Prefer: count=exact" -H "Range: 0-0" ("${rest}?select=id")
  $cr = ($h | Select-String -Pattern "content-range" | Select-Object -First 1).Line
  if (-not $cr) {
    $g = curl.exe -s -D - -o NUL -H "apikey: $svc" -H "Authorization: Bearer $svc" -H "Prefer: count=exact" -H "Range: 0-0" ("${rest}?select=id")
    $cr = ($g | Select-String -Pattern "content-range" | Select-Object -First 1).Line
  }
  $n = ""
  if ($cr) { $m = [regex]::Match($cr, "/(\d+)"); if ($m.Success) { $n = $m.Groups[1].Value } }
  $script:lastCR = $cr
  return $n
}
$after = Get-InquiryCount
Write-Output ("AFTER_CONTENT_RANGE:" + $script:lastCR)
Write-Output ("AFTER_ROW_COUNT:" + $after)
Write-Output "END_AFTER_PHASE"
