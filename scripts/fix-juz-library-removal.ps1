$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$offlinePath=Join-Path $projectRoot 'src\services\offlineQuran.ts'
$screenPath=Join-Path $projectRoot 'src\screens\DownloadedLibraryScreen.tsx'
$offline=[IO.File]::ReadAllText($offlinePath)
$addition=@'

export async function removeAllOfflineJuz(juzNumber:number){
  await ensureRoot();
  const entries=await FileSystem.readDirectoryAsync(ROOT);
  const matches=entries.filter(name=>name.startsWith(`juz-${juzNumber}-`));
  await Promise.all(matches.map(name=>FileSystem.deleteAsync(`${ROOT}${name}/`,{idempotent:true})));
}
'@
if(-not $offline.Contains('export async function removeAllOfflineJuz')){[IO.File]::WriteAllText($offlinePath,$offline+$addition)}
$screen=[IO.File]::ReadAllText($screenPath)
$screen=$screen.Replace('removeJuzOffline,removeSurahOffline','removeAllOfflineJuz,removeSurahOffline')
$screen=$screen.Replace("remove:()=>removeJuzOffline(number,'')","remove:()=>removeAllOfflineJuz(number)")
[IO.File]::WriteAllText($screenPath,$screen)
