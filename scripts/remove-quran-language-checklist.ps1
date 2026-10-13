$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$pattern = '<div className="languageChecklist">.*?</div>\}\</div>'
$regex = [regex]::new($pattern,[System.Text.RegularExpressions.RegexOptions]::Singleline)
$updated = $regex.Replace($source,'',1)
if ($updated -eq $source) { throw 'Saved languages checklist marker not found' }
Set-Content -LiteralPath $target -Value $updated -NoNewline -Encoding utf8
