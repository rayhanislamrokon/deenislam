$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$path=Join-Path $root 'src\screens\DuasCollectionScreen.tsx'
$source=[IO.File]::ReadAllText($path)
$start=$source.IndexOf(" const[query,setQuery]=useState(''),[managed,setManaged]=useState<any[]>([]);")
$endMarker='},[language]);'
$end=$source.IndexOf($endMarker,$start)
if($start -lt 0 -or $end -lt 0){throw 'Dua fetch state block not found.'}
$end+=$endMarker.Length
$replacement=@'
 const[query,setQuery]=useState(''),[managed,setManaged]=useState<any[]>([]),[refreshing,setRefreshing]=useState(false);
 const load=useCallback(async(showRefresh=false)=>{if(showRefresh)setRefreshing(true);try{const response=await fetch(`${API_URL}/api/duas/admin-content?language=${encodeURIComponent(language)}&refresh=${Date.now()}`,{headers:{'Cache-Control':'no-cache'}}),body=await response.json();setManaged(Array.isArray(body.data)?body.data:[])}catch{}finally{if(showRefresh)setRefreshing(false)}},[language]);
 useEffect(()=>{void load()},[load]);
'@
$source=$source.Substring(0,$start)+$replacement.TrimEnd()+$source.Substring($end)
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
