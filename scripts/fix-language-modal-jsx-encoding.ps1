$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$path = Join-Path $projectRoot 'admin-panel\app\components\AdminLanguagePicker.tsx'
$source = [IO.File]::ReadAllText($path)
$source = $source.Replace('</button></header><label style={searchStyle}>','</button></div><label style={searchStyle}>')
$source = [regex]::Replace($source,'<strong style=\{\{fontSize:22,color:"#087a4d"\}\}>.*?</strong>','<strong style={{fontSize:22,color:"#087a4d"}}>{"\u203A"}</strong>',1)
$source = [regex]::Replace($source,'<button type="button" onClick=\{close\} style=\{closeStyle\}>.*?</button>','<button type="button" onClick={close} style={closeStyle}>{"\u00D7"}</button>',1)
$source = [regex]::Replace($source,'<span style=\{\{color:"#087a4d",fontSize:20\}\}>.*?</span>','<span style={{color:"#087a4d",fontSize:20}}>{"\u2315"}</span>',1)
$source = [regex]::Replace($source,'"Original English content .*? Available"','"Original English content - Available"')
$source = [regex]::Replace($source,'<em style=\{checkStyle\}>.*?</em>','<em style={checkStyle}>{"\u2713"}</em>',1)
$source = [regex]::Replace($source,'<strong style=\{\{color:"#079052",fontSize:22\}\}>.*?</strong>','<strong style={{color:"#079052",fontSize:22}}>{"\u203A"}</strong>',1)
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
