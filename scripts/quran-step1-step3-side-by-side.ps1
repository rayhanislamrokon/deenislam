$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw -Encoding utf8
$marker = '`}</style></main>'
$css = @'
`}</style><style jsx>{`
@media(min-width:1080px){
  .workspace{display:grid;grid-template-columns:minmax(330px,410px) minmax(0,1fr);gap:16px;align-items:start}
  .controls{grid-column:1;grid-row:1;grid-template-columns:1fr}
  .savedLanguageBanner{grid-column:1;grid-row:2;margin-top:0}
  .meta{grid-column:1;grid-row:3;grid-template-columns:1fr;margin-top:0}
  details{grid-column:1;grid-row:4;margin-top:0}
  .ayahHead{grid-column:2;grid-row:1;margin:0 0 10px}
  .ayahs{grid-column:2;grid-row:2 / span 4;grid-template-columns:1fr!important}
  .ayahs article{height:auto}
  .copy{grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr);gap:18px}
  .copy:before{display:block}
  .sourcePane{grid-column:1;grid-row:1;padding-bottom:0;border-bottom:0}
  .translationPane{grid-column:3;grid-row:1}
  .sourcePane>p{min-height:0;font-size:24px}
  .translationPane textarea{min-height:160px}
  footer{grid-column:1 / -1;grid-row:6}
}
`}</style></main>
'@
if (-not $source.Contains('grid-template-columns:minmax(330px,410px)')) {
  $source = $source.Replace($marker, $css.TrimEnd())
}
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
