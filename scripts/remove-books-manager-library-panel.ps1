$ErrorActionPreference = 'Stop'

$target = Join-Path $PSScriptRoot '..\admin-panel\app\globals.css'
$content = [IO.File]::ReadAllText($target)
$rule = '.booksWorkspace{grid-template-columns:minmax(0,1fr)}.booksWorkspace>.bookFormPanel{width:100%;max-width:none}.booksWorkspace>.bookListPanel{height:0;min-height:0;padding:0;border:0;background:transparent;overflow:visible}.booksWorkspace>.bookListPanel>.usersHead,.booksWorkspace>.bookListPanel>.bookLibraryNav,.booksWorkspace>.bookListPanel>.bookRows{display:none}'

if (-not $content.Contains($rule)) {
    [IO.File]::AppendAllText($target, "`r`n$rule`r`n")
}
