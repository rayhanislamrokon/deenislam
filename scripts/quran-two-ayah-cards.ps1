$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw -Encoding utf8
$marker = '`}</style></main>'
$css = @'
`}</style><style jsx>{`
@media(min-width:1180px){
  .ayahs{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}
  .ayahs article{height:100%;padding:14px;gap:10px}
  .copy{grid-template-columns:1fr;gap:15px}
  .copy:before{display:none}
  .sourcePane,.translationPane{grid-column:1;grid-row:auto}
  .sourcePane{padding-bottom:14px;border-bottom:1px solid #dce8df}
  .sourcePane>p{min-height:76px;font-size:23px}
  .translationPane textarea{min-height:140px}
}
`}</style></main>
'@
if (-not $source.Contains('@media(min-width:1180px)')) {
  $source = $source.Replace($marker, $css.TrimEnd())
}
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
