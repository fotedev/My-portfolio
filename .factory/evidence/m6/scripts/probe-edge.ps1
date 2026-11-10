# M6 security audit - Check 4: submit-inquiry PASSIVE probes (no valid submissions; rate limit not triggered:
# per function source, only the honeypot path increments the per-IP net counter, by 1 of max 3/600s)
$ErrorActionPreference = "Continue"
Write-Output ("RUN_UTC: " + (Get-Date).ToUniversalTime().ToString("o"))
$fx = "https://zfhfeiqdsugjqliufhke.supabase.co/functions/v1/submit-inquiry"
$tmpD = Join-Path $env:TEMP ("edge_" + [guid]::NewGuid().ToString("N") + ".json")

Write-Output "===== P1 OPTIONS Origin=https://fotedev.me + ACRM:POST (expect 204 + ACAO echo) ====="
$h1 = curl.exe -s -S -D - -o NUL -X OPTIONS -H "Origin: https://fotedev.me" -H "Access-Control-Request-Method: POST" -w "CURL_STATUS:%{http_code}\n" $fx
Write-Output $h1

Write-Output "===== P2 OPTIONS Origin=https://evil.example + ACRM:POST (expect 403 or no ACAO) ====="
$h2 = curl.exe -s -S -D - -o NUL -X OPTIONS -H "Origin: https://evil.example" -H "Access-Control-Request-Method: POST" -w "CURL_STATUS:%{http_code}\n" $fx
Write-Output $h2

Write-Output "===== P3 POST no Origin (expect 403) ====="
$code = curl.exe -s -o $tmpD -w "%{http_code}" -X POST -H "Content-Type: application/json" --data "{}" $fx
Write-Output ("P3_STATUS:" + $code + " P3_BODY:" + ([System.IO.File]::ReadAllText($tmpD)))

Write-Output "===== P4 POST multipart content-type (expect 415) ====="
$code = curl.exe -s -o $tmpD -w "%{http_code}" -X POST -H "Origin: https://fotedev.me" -F "probe=1" $fx
Write-Output ("P4_STATUS:" + $code + " P4_BODY:" + ([System.IO.File]::ReadAllText($tmpD)))

Write-Output "===== P5 POST invalid JSON (expect 400) ====="
$code = curl.exe -s -o $tmpD -w "%{http_code}" -X POST -H "Origin: https://fotedev.me" -H "Content-Type: application/json" --data "{invalid" $fx
Write-Output ("P5_STATUS:" + $code + " P5_BODY:" + ([System.IO.File]::ReadAllText($tmpD)))

Write-Output "===== P6 POST honeypot-filled body (expect 200-drop, rows unchanged) ====="
$body6 = '{"name":"SEC-PROBE","email":"sec-probe@invalid.example","company_website":"SPAM-BOT-CONTENT"}'
$code = curl.exe -s -o $tmpD -w "%{http_code}" -X POST -H "Origin: https://fotedev.me" -H "Content-Type: application/json" --data $body6 $fx
Write-Output ("P6_STATUS:" + $code + " P6_BODY:" + ([System.IO.File]::ReadAllText($tmpD)))

Write-Output "===== P7 POST valid-shape JSON + fabricated turnstile token XXXX.DUMMY.TOKEN (expect 403 siteverify fail) ====="
$body7 = '{"name":"SEC-PROBE","email":"sec-probe@invalid.example","serviceInterest":"web-apps","message":"passive security audit probe - turnstile siteverify negative test (not a real inquiry)","submissionToken":"a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d","company_website":"","turnstileToken":"XXXX.DUMMY.TOKEN"}'
$code = curl.exe -s -o $tmpD -w "%{http_code}" -X POST -H "Origin: https://fotedev.me" -H "Content-Type: application/json" --data $body7 $fx
Write-Output ("P7_STATUS:" + $code + " P7_BODY:" + ([System.IO.File]::ReadAllText($tmpD)))
Write-Output "END_EDGE_PROBES"
