$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$single = [System.Text.RegularExpressions.RegexOptions]::Singleline
$source = [regex]::Replace($source,'<Link href="/">.*?Back to Dashboard</Link>','<Link href="/">{"\u2039"} Back to Dashboard</Link>',$single)
$source = [regex]::Replace($source,'<p>Add reviewed meanings once.*?</p>','<p>Add reviewed meanings once and serve them from your own database - without repeated translation cost.</p>',$single)
$source = [regex]::Replace($source,'<section className="steps">.*?</section>','<section className="steps"><b>1<span>Choose language</span></b><i>-</i><b>2<span>Choose Surah</span></b><i>-</i><b>3<span>Add meanings</span></b><i>-</i><b>4<span>Review &amp; save</span></b></section>',$single)
$source = [regex]::Replace($source,'<label className="languagePickerLabel">Step 1 .*? Content language<button','<label className="languagePickerLabel">Step 1 - Content language<button',$single)
$source = [regex]::Replace($source,'\?<em>.*? SAVED</em>:<em className="missing">','?<em>{"\u2713"} SAVED</em>:<em className="missing">',$single)
$source = [regex]::Replace($source,'<strong>.*?</strong></button></label><label>Step 2 .*? Select Surah<select','<strong>v</strong></button></label><label>Step 2 - Select Surah<select',$single)
$source = [regex]::Replace($source,'\{x\.number\}\. \{x\.englishName\}.*?\{x\.numberOfAyahs\} Ayahs','{x.number}. {x.englishName} - {x.numberOfAyahs} Ayahs',$single)
$source = [regex]::Replace($source,'<i>.*?</i><div><b>\{languages\.find\(x=>x\.code===language\)','<i>{"\u2713"}</i><div><b>{languages.find(x=>x.code===language)',$single)
$source = [regex]::Replace($source,'Step 4 .*? Review carefully','Step 4 - Review carefully',$single)
$source = [regex]::Replace($source,'ORIGINAL .*? LOCKED','ORIGINAL - LOCKED',$single)
$source = [regex]::Replace($source,'meaning here.*?`','meaning here...`',$single)
$source = [regex]::Replace($source,'Find Ayah number or text.*?"','Find Ayah number or text..."',$single)
$source = [regex]::Replace($source,'\?".*? Translation ready":"Not added yet"','?"\u2713 Translation ready":"Not added yet"',$single)
$source = [regex]::Replace($source,'\?` .*? \$\{\(surah','?` - ${(surah',$single)
$source = $source.Replace('>×</button>','>x</button>').Replace('<strong>›</strong>','<strong>&gt;</strong>')
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
