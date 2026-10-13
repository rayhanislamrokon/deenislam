$screen = Join-Path $PSScriptRoot '..\src\screens\BooksScreen.tsx'
$text = [IO.File]::ReadAllText($screen)
$text = $text.Replace("'Sahaba'|'Islamic History'", "'Sahaba'|'Male Sahaba'|'Female Sahabiyat'|'Islamic History'")
$oldState = "const[q,setQ]=useState(''),[category,setCategory]=useState<Category>(initialCategory),[grid,setGrid]"
$newState = "const[q,setQ]=useState(''),[category,setCategory]=useState<Category>(initialCategory),[sahabaGroup,setSahabaGroup]=useState<'All'|'Male'|'Female'>('All'),[grid,setGrid]"
if (-not $text.Contains($oldState)) { throw 'Books state marker not found' }
$text = $text.Replace($oldState,$newState)
$text = $text.Replace("x.category==='Sahaba'?'sahaba'", "['Sahaba','Male Sahaba','Female Sahabiyat'].includes(x.category)?'sahaba'")
$oldFilter = 'availableBooks.filter(x=>(category==='''All'''||x.category===category)&&(!q||`${x.title} ${x.author} ${x.category}`.toLowerCase().includes(q.toLowerCase())))'
$newFilter = 'availableBooks.filter(x=>{const sahaba=category==='''Sahaba'''&&['''Sahaba''','''Male Sahaba''','''Female Sahabiyat'''].includes(x.category),gender=sahabaGroup==='''All'''||(sahabaGroup==='''Male'''&&x.category==='''Male Sahaba''')||(sahabaGroup==='''Female'''&&x.category==='''Female Sahabiyat''');return(category==='''All'''||x.category===category||(sahaba&&gender))&&(!q||`${x.title} ${x.author} ${x.category}`.toLowerCase().includes(q.toLowerCase()))})'
if (-not $text.Contains($oldFilter)) { throw 'Books filter marker not found' }
$text = $text.Replace($oldFilter,$newFilter).Replace('[availableBooks,q,category])','[availableBooks,q,category,sahabaGroup])')
$searchEnd = '</View>{loading?<ActivityIndicator'
$genderTabs = '</View>{initialCategory==="Sahaba"?<View style={s.sahabaTabs}><Pressable onPress={()=>setSahabaGroup("All")} style={[s.sahabaTab,sahabaGroup==="All"&&s.sahabaTabOn]}><Text style={[s.sahabaTabText,sahabaGroup==="All"&&s.sahabaTabTextOn]}>All</Text></Pressable><Pressable onPress={()=>setSahabaGroup("Male")} style={[s.sahabaTab,sahabaGroup==="Male"&&s.sahabaTabOn]}><Text style={[s.sahabaTabText,sahabaGroup==="Male"&&s.sahabaTabTextOn]}>Male Sahaba</Text></Pressable><Pressable onPress={()=>setSahabaGroup("Female")} style={[s.sahabaTab,sahabaGroup==="Female"&&s.sahabaTabOn]}><Text style={[s.sahabaTabText,sahabaGroup==="Female"&&s.sahabaTabTextOn]}>Female Sahabiyat</Text></Pressable></View>:null}{loading?<ActivityIndicator'
if (-not $text.Contains($searchEnd)) { throw 'Search insertion marker not found' }
$text = $text.Replace($searchEnd,$genderTabs)
$text = $text.Replace("searchIcon:{fontSize:22,color:'#718078'},", "searchIcon:{fontSize:22,color:'#718078'},sahabaTabs:{marginTop:14,padding:4,borderRadius:14,backgroundColor:'#EAF5ED',flexDirection:'row',gap:5},sahabaTab:{flex:1,minHeight:39,paddingHorizontal:7,borderRadius:11,alignItems:'center',justifyContent:'center'},sahabaTabOn:{backgroundColor:G},sahabaTabText:{fontSize:10,fontWeight:'700',textAlign:'center',color:G},sahabaTabTextOn:{color:'#FFF'},")
[IO.File]::WriteAllText($screen,$text,[Text.UTF8Encoding]::new($false))

$admin = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$text = [IO.File]::ReadAllText($admin)
$oldOptions = '<option>History</option><option>Seerah</option></select>'
$newOptions = '<option>History</option><option>Seerah</option><option>Male Sahaba</option><option>Female Sahabiyat</option></select>'
if (-not $text.Contains($oldOptions)) { throw 'Admin category options marker not found' }
$text = $text.Replace($oldOptions,$newOptions)
[IO.File]::WriteAllText($admin,$text,[Text.UTF8Encoding]::new($false))
