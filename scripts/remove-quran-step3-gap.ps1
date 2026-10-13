$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw -Encoding utf8
$marker = '`}</style></main>'
$css = @'
`}</style><style jsx>{`
@media(min-width:1080px){
  .ayahHead{position:relative;z-index:2}
  .ayahs{grid-column:2;grid-row:1 / span 5;padding-top:78px;align-self:start}
}
`}</style></main>
'@
if (-not $source.Contains('padding-top:78px;align-self:start')) {
  $source = $source.Replace($marker, $css.TrimEnd())
}
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
