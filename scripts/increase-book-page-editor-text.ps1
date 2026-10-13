$path=Join-Path $PSScriptRoot '..\admin-panel\app\books\BookPageBuilder.tsx';$content=[IO.File]::ReadAllText($path)
$old='.pages :global(.richEditorBody){min-height:260px}'
$new='.pages :global(.richEditorBody){min-height:300px;font-size:18px!important;line-height:1.85!important;color:#203d30!important}.pages :global(.richEditorBody p){font-size:18px!important;line-height:1.85!important}'
if(-not $content.Contains($old)){throw 'Book editor body style not found'};$content=$content.Replace($old,$new)
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
