# M6 security audit - Check 6: secrets hygiene over TRACKED files (output shows file + 10-char prefix only, never full values)
$ErrorActionPreference = "Continue"
Write-Output ("RUN_UTC: " + (Get-Date).ToUniversalTime().ToString("o"))
Set-Location "C:\programming\github\My-Portfolio"
Write-Output ("GIT_HEAD:" + (git log -1 --format=%H))
$tracked = (git ls-files | Measure-Object).Count
Write-Output ("TRACKED_FILES:" + $tracked)
$pattern = "(re_[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|0x4AAAAAAA)"
$files = @(git grep -l -i -E -I $pattern)
if ($files.Count -eq 0) {
  Write-Output "NO_SECRET_PATTERN_HITS_IN_TRACKED_FILES"
} else {
  foreach ($f in $files) {
    $ms = @(git grep -o -h -i -E -I $pattern -- $f)
    $pfx = ($ms | ForEach-Object { if ($_.Length -ge 10) { $_.Substring(0, 10) } else { $_ } }) -join ", "
    Write-Output ("HIT_FILE:" + $f + " | MATCH_COUNT:" + $ms.Count + " | PREFIXES(10): " + $pfx)
  }
}
Write-Output "END_SECRETS_SCAN"
