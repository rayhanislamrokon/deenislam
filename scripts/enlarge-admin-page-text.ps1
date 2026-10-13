$path = Join-Path $PSScriptRoot '..\admin-panel\app\globals.css'
$css = [IO.File]::ReadAllText($path)
$start = '/* Readable text sizing inside admin pages; sidebar is intentionally unchanged. */'
if ($css.Contains($start)) { throw 'Admin page text sizing already applied' }
$css += @'

/* Readable text sizing inside admin pages; sidebar is intentionally unchanged. */
main p{font-size:13px!important;line-height:1.55!important}
main label{font-size:12px!important;line-height:1.4!important}
main input,main select,main textarea{font-size:14px!important}
main button{font-size:13px!important}
main td{font-size:13px!important}
main th{font-size:11px!important}
main small{font-size:11px!important;line-height:1.4!important}
main .eyebrow,main [class*="eyebrow"]{font-size:11px!important}
@media(max-width:780px){main p{font-size:12.5px!important}main input,main select,main textarea{font-size:14px!important}}
'@
[IO.File]::WriteAllText($path, $css, [Text.UTF8Encoding]::new($false))
