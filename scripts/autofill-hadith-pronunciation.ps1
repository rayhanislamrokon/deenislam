$path = Join-Path $PSScriptRoot '..\admin-panel\app\hadith\page.tsx'
$content = [IO.File]::ReadAllText($path)

$content = $content.Replace("import Link from 'next/link';", "import Link from 'next/link';`r`nimport {transliterate} from 'transliteration';")

$old = "function edit(row:any,lang=language){const t=lang==='en'?row:row.translations?.[lang]||{};setForm({...empty,...row,...t,id:row.external?`"`":row.id,collectionId:row.collectionId,collectionName:row.collectionName,arabic:row.arabic,published:row.published!==false});"
$new = "function edit(row:any,lang=language){const t=lang==='en'?row:row.translations?.[lang]||{};const generatedPronunciation=lang==='en'&&row.arabic&&!t.pronunciation?transliterate(row.arabic):'';setForm({...empty,...row,...t,pronunciation:t.pronunciation||generatedPronunciation,id:row.external?`"`":row.id,collectionId:row.collectionId,collectionName:row.collectionName,arabic:row.arabic,published:row.published!==false});"

if (-not $content.Contains($old)) { throw 'Hadith edit function target not found.' }
$content = $content.Replace($old, $new)
[IO.File]::WriteAllText($path, $content, [Text.UTF8Encoding]::new($false))
