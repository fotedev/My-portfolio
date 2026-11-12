# M6 security audit - Check 3 (BEFORE count + anon-key probe). Secrets stay in process memory, never printed.
$ErrorActionPreference = "Continue"
Write-Output ("RUN_UTC: " + (Get-Date).ToUniversalTime().ToString("o"))
$envPath = "C:\programming\github\My-Portfolio\.env.local"
if (-not (Test-Path $envPath)) { Write-Output "ABORT: .env.local not found"; exit 1 }
$lines = Get-Content $envPath
$aLine = $lines | Where-Object { $_ -match "^\s*(export\s+)?NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=" } | Select-Object -First 1
$sLine = $lines | Where-Object { $_ -match "^\s*(export\s+)?SUPABASE_SERVICE_ROLE_KEY\s*=" } | Select-Object -First 1
$anon = ""; $svc = ""
if ($aLine) { $anon = ($aLine -replace "^\s*(export\s+)?NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*", "").Trim().Trim('"').Trim("'") }
if ($sLine) { $svc  = ($sLine -replace "^\s*(export\s+)?SUPABASE_SERVICE_ROLE_KEY\s*=\s*", "").Trim().Trim('"').Trim("'") }
Write-Output ("ENV_ANON_PRESENT:" + [bool]$anon + " ENV_SERVICE_PRESENT:" + [bool]$svc)
if (-not $svc) { Write-Output "ABORT: SUPABASE_SERVICE_ROLE_KEY missing in .env.local"; exit 1 }
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
$before = Get-InquiryCount
Write-Output ("BEFORE_CONTENT_RANGE:" + $script:lastCR)
Write-Output ("BEFORE_ROW_COUNT:" + $before)
Write-Output "===== ANON-KEY PROBE (GET inquiries?select=*) ====="
$tmpA = Join-Path $env:TEMP ("anon_inq_" + [guid]::NewGuid().ToString("N") + ".json")
$code = curl.exe -s -o $tmpA -w "%{http_code}" -H "apikey: $anon" -H "Authorization: Bearer $anon" ("${rest}?select=*")
Write-Output ("ANON_STATUS:" + $code)
$raw = ""
if (Test-Path $tmpA) { $raw = [System.IO.File]::ReadAllText($tmpA) }
$parsed = $false
try { $j = $raw | ConvertFrom-Json; if ($j -is [array]) { $parsed = $true; Write-Output ("ANON_ROWS_VISIBLE:" + $j.Count) } } catch {}
if (-not $parsed) {
  $s = ($raw -replace "\s+", " ")
  if ($s.Length -gt 0) { Write-Output ("ANON_BODY_SNIPPET:" + $s.Substring(0, [Math]::Min(300, $s.Length))) }
}
Write-Output "END_BEFORE_PHASE"
