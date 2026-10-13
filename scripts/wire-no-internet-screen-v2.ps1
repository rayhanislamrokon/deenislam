$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$appPath=Join-Path $projectRoot 'App.tsx'
$text=[IO.File]::ReadAllText($appPath)
$text=$text.Replace("import { StatusBar } from 'expo-status-bar';","import { StatusBar } from 'expo-status-bar';`nimport * as Network from 'expo-network';")
$text=$text.Replace("import { DownloadedLibraryScreen } from './src/screens/DownloadedLibraryScreen';","import { DownloadedLibraryScreen } from './src/screens/DownloadedLibraryScreen';`nimport { NoInternetScreen } from './src/screens/NoInternetScreen';")
$anchor="export default function App() {"
$state="export default function App() {`n  const [networkOffline,setNetworkOffline]=useState(false);`n  const [offlineMode,setOfflineMode]=useState(false);`n  const [checkingNetwork,setCheckingNetwork]=useState(false);"
if(-not $text.Contains($anchor)){throw 'App component anchor not found.'};$text=$text.Replace($anchor,$state)
$effectAnchor="  const [screen, setScreen] = useState<AppScreen>('splash');"
$effect="  const [screen, setScreen] = useState<AppScreen>('splash');`n  useEffect(()=>{let active=true;const apply=(state:Network.NetworkState)=>{if(!active)return;const disconnected=state.isConnected===false||state.isInternetReachable===false;setNetworkOffline(disconnected);if(!disconnected)setOfflineMode(false)};void Network.getNetworkStateAsync().then(apply).catch(()=>undefined);const subscription=Network.addNetworkStateListener(apply);return()=>{active=false;subscription.remove()}},[]);`n  const retryNetwork=async()=>{setCheckingNetwork(true);try{const state=await Network.getNetworkStateAsync();const disconnected=state.isConnected===false||state.isInternetReachable===false;setNetworkOffline(disconnected);if(!disconnected)setOfflineMode(false)}finally{setCheckingNetwork(false)}};"
if(-not $text.Contains($effectAnchor)){throw 'Screen state anchor not found.'};$text=$text.Replace($effectAnchor,$effect)
$returnAnchor="  return (`n    <View style={styles.container}>"
$replacement="  if(networkOffline&&!offlineMode)return <NoInternetScreen checking={checkingNetwork} onRetry={()=>void retryNetwork()} onContinue={()=>setOfflineMode(true)}/>;`n`n  return (`n    <View style={styles.container}>"
if(-not $text.Contains($returnAnchor)){throw 'Main app return anchor not found.'};$text=$text.Replace($returnAnchor,$replacement)
[IO.File]::WriteAllText($appPath,$text)
