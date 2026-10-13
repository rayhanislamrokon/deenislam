$path = Join-Path $PSScriptRoot '..\admin-panel\app\sahaba\page.tsx'
$text = [IO.File]::ReadAllText($path)
$text = $text.Replace('import RichTextEditor from"../islamic-lifestyle/RichTextEditor";','import BookPageBuilder from"../books/BookPageBuilder";')
$oldState = '[tokenValue,setTokenValue]=useState(""),[items,setItems]=useState<any[]>([])'
$newState = '[tokenValue,setTokenValue]=useState(""),[languages,setLanguages]=useState<any[]>([{code:"en",label:"English"},{code:"bn",label:"Bengali"},{code:"ar",label:"Arabic"}]),[items,setItems]=useState<any[]>([])'
if (-not $text.Contains($oldState)) { throw 'Sahaba state marker not found' }
$text = $text.Replace($oldState,$newState)
$oldEffect = 'useEffect(()=>{setTokenValue(sessionStorage.getItem("deenislam_admin_token")||"");void load()},[]);'
$newEffect = 'useEffect(()=>{setTokenValue(sessionStorage.getItem("deenislam_admin_token")||"");void load();fetch(API+"/api/translate/languages").then(r=>r.json()).then(j=>{if(Array.isArray(j.data)&&j.data.length)setLanguages(j.data)}).catch(()=>{})},[]);'
if (-not $text.Contains($oldEffect)) { throw 'Sahaba effect marker not found' }
$oldBody = 'const body={...form,pages:[{number:1,text:form.content,markdown:form.content,confidence:100,needsReview:false}],extraction:{method:"editorial",pageCount:1,averageConfidence:100,needsReview:[]}}'
$newBody = 'const pages=(form.pages?.length?form.pages:[{number:1,text:form.content,markdown:form.content,confidence:100,needsReview:false}]).map((page:any,index:number)=>({...page,number:index+1})),body={...form,pages,content:pages.map((page:any)=>page.markdown||page.text||"").join("\n\n"),extraction:{method:"editorial",pageCount:pages.length,averageConfidence:100,needsReview:[]}}'
if (-not $text.Contains($oldBody)) { throw 'Sahaba save body marker not found' }
$text = $text.Replace($oldBody,$newBody)
$oldLanguage = '<label>Language<select value={form.languageCode} onChange={e=>setForm({...form,languageCode:e.target.value,language:e.target.value==="bn"?"Bengali":"English"})}><option value="en">English</option><option value="bn">Bengali</option></select></label>'
$newLanguage = '<label>Language<select value={form.languageCode} onChange={e=>{const selected=languages.find(item=>item.code===e.target.value);setForm({...form,languageCode:e.target.value,language:selected?.label||e.target.value.toUpperCase()})}}>{languages.map(item=><option key={item.code} value={item.code}>{item.label} ({item.code.toUpperCase()})</option>)}</select></label>'
if (-not $text.Contains($oldLanguage)) { throw 'Language selector marker not found' }
$text = $text.Replace($oldLanguage,$newLanguage)
$oldEditor = '<div className="wide editor"><label>Complete life story</label><RichTextEditor value={form.content} onChange={content=>setForm({...form,content})} api={API} token={tokenValue} onMessage={setMessage} recordId={`sahaba:${form.slug||"new"}:${form.languageCode}`}/></div>'
$newEditor = '<div className="wide editor"><label>Biography pages</label><BookPageBuilder pages={form.pages||[]} content={form.content||""} api={API} token={tokenValue} language={form.language} recordId={`sahaba:${form.slug||"new"}:${form.languageCode}`} onMessage={setMessage} onChange={(pages,content)=>setForm({...form,pages,content})}/></div>'
if (-not $text.Contains($oldEditor)) { throw 'Biography editor marker not found' }
$text = $text.Replace($oldEditor,$newEditor)
[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))
