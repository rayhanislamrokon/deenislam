$path = Join-Path $PSScriptRoot '..\src\screens\BooksScreen.tsx'
$text = [IO.File]::ReadAllText($path)
$marker = "const G='#087A45',I='#17392D',B='#F8FCF8';"
$map = @'
const G='#087A45',I='#17392D',B='#F8FCF8';const SAHABA_COVERS:Record<string,any>={
 'sahabi-abu-bakr-as-siddiq':require('../../assets/sahabi-abu-bakr.png'),
 'sahabi-umar-ibn-al-khattab':require('../../assets/sahabi-umar.png'),
 'sahabi-uthman-ibn-affan':require('../../assets/sahabi-uthman.png'),
 'sahabi-ali-ibn-abi-talib':require('../../assets/sahabi-ali.png'),
 'sahabi-bilal-ibn-rabah':require('../../assets/sahabi-bilal.png'),
 'sahabi-salman-al-farisi':require('../../assets/sahabi-salman.png'),
 'sahabiyah-khadijah-bint-khuwaylid':require('../../assets/sahabiyah-khadijah.png'),
 'sahabiyah-aisha-bint-abi-bakr':require('../../assets/sahabiyah-aisha.png'),
 'sahabiyah-fatima-az-zahra':require('../../assets/sahabiyah-fatimah.png'),
 'sahabiyah-asma-bint-abi-bakr':require('../../assets/sahabiyah-asma.png'),
 'sahabiyah-umm-salama':require('../../assets/sahabiyah-umm-salama.png'),
 'sahabiyah-nusaybah-bint-kab':require('../../assets/sahabiyah-nusaybah.png')};
'@
if (-not $text.Contains($marker)) { throw 'Books constants marker not found' }
$text = $text.Replace($marker,$map)
$old = "coverSource=(x:Book)=>x.coverImageUrl?{uri:x.coverImageUrl}:x.category==='Female Sahabiyat'?require('../../assets/sahabiyat-female-cover.png'):require('../../assets/sahaba-male-cover.png');"
$new = "coverSource=(x:Book)=>x.coverImageUrl?{uri:x.coverImageUrl}:SAHABA_COVERS[x.slug||x.id]||(x.category==='Female Sahabiyat'?require('../../assets/sahabiyat-female-cover.png'):require('../../assets/sahaba-male-cover.png'));"
if (-not $text.Contains($old)) { throw 'Cover source marker not found' }
$text = $text.Replace($old,$new)
[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))
