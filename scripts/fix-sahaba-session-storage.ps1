$path = Join-Path $PSScriptRoot '..\admin-panel\app\sahaba\page.tsx'
$text = [IO.File]::ReadAllText($path)
$oldState = 'export default function SahabaAdmin(){const[items,setItems]=useState<any[]>([])'
$newState = 'export default function SahabaAdmin(){const[tokenValue,setTokenValue]=useState(""),[items,setItems]=useState<any[]>([])'
if (-not $text.Contains($oldState)) { throw 'Sahaba component state marker not found' }
$text = $text.Replace($oldState,$newState)
$oldEffect = 'useEffect(()=>{void load()},[]);'
$newEffect = 'useEffect(()=>{setTokenValue(sessionStorage.getItem("deenislam_admin_token")||"");void load()},[]);'
if (-not $text.Contains($oldEffect)) { throw 'Sahaba load effect marker not found' }
$text = $text.Replace($oldEffect,$newEffect)
$oldEditor = 'api={API} token={token()} onMessage={setMessage}'
$newEditor = 'api={API} token={tokenValue} onMessage={setMessage}'
if (-not $text.Contains($oldEditor)) { throw 'Rich editor token marker not found' }
$text = $text.Replace($oldEditor,$newEditor)
[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))
