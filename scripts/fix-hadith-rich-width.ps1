$path = Join-Path $PSScriptRoot '..\src\screens\HadithReaderScreen.tsx'
$content = [IO.File]::ReadAllText($path)
$needle = "export function HadithReaderScreen({collection,item,items,saved,onSave,onBack,onChange}:Props){`n const index="
$replacement = "export function HadithReaderScreen({collection,item,items,saved,onSave,onBack,onChange}:Props){`n const {width}=useWindowDimensions();`n const index="
if (-not $content.Contains($needle)) { throw 'Hadith reader function target not found.' }
$content = $content.Replace($needle,$replacement)
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
