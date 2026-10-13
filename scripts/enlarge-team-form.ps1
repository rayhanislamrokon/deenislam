$path = Join-Path $PSScriptRoot '..\admin-panel\app\team\page.tsx'
$text = [IO.File]::ReadAllText($path)
$old = '.layout{display:grid;grid-template-columns:minmax(360px,.75fr) minmax(520px,1.25fr);gap:18px;margin-top:18px;align-items:start}'
$new = '.layout{display:grid;grid-template-columns:minmax(540px,1fr) minmax(540px,1fr);gap:20px;margin-top:18px;align-items:start}'
if (-not $text.Contains($old)) { throw 'Team layout style not found' }
$text = $text.Replace($old, $new)
$text = $text.Replace('.panel{padding:22px;', '.panel{padding:26px;')
$text = $text.Replace('.fields{display:grid;gap:12px;', '.fields{display:grid;gap:16px;')
$text = $text.Replace('input,select{width:100%;margin-top:6px;padding:11px;', 'input,select{width:100%;margin-top:7px;padding:13px;')
[IO.File]::WriteAllText($path, $text, [Text.UTF8Encoding]::new($false))
