$path = Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\page.tsx'
$content = [IO.File]::ReadAllText((Resolve-Path $path), [Text.Encoding]::UTF8)
$content = $content.Replace('items.filter(ch=>ch.kind==="chapter"&&ch.parentCategorySlug===cat.slug)', 'languageItems.filter(ch=>ch.kind==="chapter"&&ch.parentCategorySlug===cat.slug)')
$content = $content.Replace('<b>No chapter content yet</b>', '<b>No {activeLanguageName} chapter content yet</b>')
$content = $content.Replace('<span>Select “Chapter inside category” in the form and create the first chapter.</span>', '<span>{language==="en"?"Create the first chapter from the form.":`Choose an existing chapter and add its ${activeLanguageName} translation.`}</span>')
[IO.File]::WriteAllText((Resolve-Path $path), $content, [Text.UTF8Encoding]::new($false))
