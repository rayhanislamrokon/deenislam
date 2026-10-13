$target = Join-Path $PSScriptRoot '..\admin-panel\app\prophets\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$old = 'onClick={()=>{setPreview(item);setOpenPreviewPart(null)}}>View</button>'
$new = 'onClick={()=>window.location.href=`/prophets/preview?id=${encodeURIComponent(item.id)}&language=${encodeURIComponent(language)}`}>View</button>'
if (-not $source.Contains($old)) { throw 'Prophet View button marker not found' }
$source = $source.Replace($old,$new)
Set-Content -LiteralPath $target -Value $source -NoNewline
