$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$path=Join-Path $root 'src\screens\DuasCollectionScreen.tsx'
$source=[IO.File]::ReadAllText($path)
$pattern=" const\[query,setQuery\]=useState\(''\),\[managed,setManaged\]=useState<any\[\]>\(\[\]\);\s*useEffect\(\(\)=>\{let active=true;fetch\(`\$\{API_URL\}/api/duas/admin-content\?language=\$\{encodeURIComponent\(language\)\}`\).*?\},\[language\]\);"
$replacement=@'
 const[query,setQuery]=useState(''),[managed,setManaged]=useState<any[]>([]),[refreshing,setRefreshing]=useState(false);
 const load=useCallback(async(showRefresh=false)=>{if(showRefresh)setRefreshing(true);try{const response=await fetch(`${API_URL}/api/duas/admin-content?language=${encodeURIComponent(language)}&refresh=${Date.now()}`,{headers:{'Cache-Control':'no-cache'}}),body=await response.json();setManaged(Array.isArray(body.data)?body.data:[])}catch{}finally{if(showRefresh)setRefreshing(false)}},[language]);
 useEffect(()=>{void load()},[load]);
'@
$source=[regex]::Replace($source,$pattern,$replacement.TrimEnd(),1)
if($source -notmatch 'setRefreshing') {throw 'Refresh state replacement failed.'}
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
