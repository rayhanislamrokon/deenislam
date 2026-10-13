$target = Join-Path $PSScriptRoot '..\src\services\offlineQuran.ts'
$source = Get-Content -LiteralPath $target -Raw
$source = [regex]::Replace($source, '(export async function saveSurahOffline\([\s\S]*?onProgress\?: \(value: number\) => void,)\s*\)', '$1' + "`r`n  notify = true,`r`n)", 1)
$juzStart = $source.IndexOf('export async function saveJuzOffline')
if ($juzStart -ge 0) {
  $before = $source.Substring(0, $juzStart)
  $after = $source.Substring($juzStart).Replace('if(notify)showDownloadProgress(downloadTitle,value*100);', 'showDownloadProgress(downloadTitle,value*100);')
  $source = $before + $after
}
Set-Content -LiteralPath $target -Value $source -Encoding utf8
