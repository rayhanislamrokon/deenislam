$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$path = Join-Path $projectRoot 'admin-panel\app\components\AdminLanguagePicker.tsx'
$source = [IO.File]::ReadAllText($path).Replace('gap:10;marginTop:16','gap:10,marginTop:16')
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
