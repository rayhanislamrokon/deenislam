$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
function Edit([string]$relative,[scriptblock]$change){$path=Join-Path $root $relative;$text=[IO.File]::ReadAllText($path);$text=& $change $text;[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))}
Edit 'src\screens\BooksScreen.tsx' {param($t) $t.Replace("|'Islamic History';type Book","|'Islamic History'|'Amol';type Book")}
Edit 'App.tsx' {
 param($t)
 if($t -notmatch 'DuasAmolHubScreen'){$t=$t.Replace("import { DuasCollectionScreen } from './src/screens/DuasCollectionScreen';","import { DuasCollectionScreen } from './src/screens/DuasCollectionScreen';"+[Environment]::NewLine+"import { DuasAmolHubScreen } from './src/screens/DuasAmolHubScreen';")}
 $t=$t.Replace(" | 'islamic-history';"," | 'islamic-history' | 'duas-amol';")
 $t=$t.Replace("useState<'home' | 'library'>('library')","useState<'home' | 'library' | 'duas-amol'>('library')")
 $t=$t.Replace("'Sahaba' | 'Islamic History'>('All')","'Sahaba' | 'Islamic History' | 'Amol'>('All')")
 $t=$t.Replace(" || screen === 'islamic-history' || screen === 'login'"," || screen === 'islamic-history' || screen === 'duas-amol' || screen === 'login'")
 $t=$t.Replace("onOpenDuas={() => setScreen('duas')}","onOpenDuas={() => setScreen('duas-amol')}")
 $t=$t.Replace("{screen === 'duas' && <DuasCollectionScreen language={selectedLanguage} onBack={() => setScreen('home')} />}","{screen === 'duas-amol' && <DuasAmolHubScreen onBack={() => setScreen('home')} onOpenDuas={() => setScreen('duas')} onOpenAmol={() => { setBooksInitialCategory('Amol'); setBooksReturnScreen('duas-amol'); setScreen('books'); }} />}`r`n      {screen === 'duas' && <DuasCollectionScreen language={selectedLanguage} onBack={() => setScreen('duas-amol')} />}")
 return $t
}
Edit 'admin-panel\app\page.tsx' {
 param($t)
 $t=$t.Replace('"hadith"|"duas"|"security"','"hadith"|"duas"|"amol"|"security"')
 $t=$t.Replace('<button className={view==="duas"?"active":""} onClick={()=>setView("duas")}><NavIcon name="duas"/><span>Duas Content</span></button>','<button className={view==="duas"?"active":""} onClick={()=>setView("duas")}><NavIcon name="duas"/><span>Duas Content</span></button><button className={view==="amol"?"active":""} onClick={()=>{setView("amol");setBookForm(current=>({...current,category:"Amol"}))}}><NavIcon name="lifestyle"/><span>Amol Content</span></button>')
 $t=$t.Replace('{view==="books"&&<section className="booksWorkspace">','{(view==="books"||view==="amol")&&<section className="booksWorkspace">')
 $t=$t.Replace('<option>Female Sahabiyat</option></select>','<option>Female Sahabiyat</option><option>Amol</option></select>')
 return $t
}
