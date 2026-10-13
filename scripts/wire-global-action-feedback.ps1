$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$appPath=Join-Path $projectRoot 'App.tsx';$bookmarkPath=Join-Path $projectRoot 'src\services\bookmarks.ts';$quranOfflinePath=Join-Path $projectRoot 'src\services\offlineQuran.ts'
$app=[IO.File]::ReadAllText($appPath)
$app=$app.Replace("import { NoInternetScreen } from './src/screens/NoInternetScreen';","import { NoInternetScreen } from './src/screens/NoInternetScreen';`nimport { GlobalActionFeedback } from './src/components/GlobalActionFeedback';")
$anchor="      <StatusBar style=\"dark\" />"
if(-not $app.Contains($anchor)){throw 'App status bar anchor not found.'};$app=$app.Replace($anchor,$anchor+"`n      <GlobalActionFeedback />")
[IO.File]::WriteAllText($appPath,$app)
$bookmarks=[IO.File]::ReadAllText($bookmarkPath)
$bookmarks="import { showActionToast } from './actionFeedback';`n"+$bookmarks
$old="export async function toggleBookmarkItem(item:Omit<BookmarkItem,'createdAt'>){const rows=await listBookmarks();const exists=rows.some(row=>row.id===item.id);if(exists)await removeBookmark(item.id);else await saveBookmark(item);return !exists}"
$new="export async function toggleBookmarkItem(item:Omit<BookmarkItem,'createdAt'>){const rows=await listBookmarks();const exists=rows.some(row=>row.id===item.id);if(exists){await removeBookmark(item.id);showActionToast('Removed from bookmarks','removed')}else{await saveBookmark(item);showActionToast('Added to bookmarks')}return !exists}"
if(-not $bookmarks.Contains($old)){throw 'Bookmark toggle not found.'};$bookmarks=$bookmarks.Replace($old,$new);[IO.File]::WriteAllText($bookmarkPath,$bookmarks)
$offline=[IO.File]::ReadAllText($quranOfflinePath)
$offline="import { failDownload, finishDownload, showDownloadProgress } from './actionFeedback';`n"+$offline
$offline=$offline.Replace("  const directory = packageDirectory(surah.number, reciter.id);","  const downloadTitle=`Surah ${surah.englishName||surah.number}`;showDownloadProgress(downloadTitle,1);`n  const directory = packageDirectory(surah.number, reciter.id);")
$offline=$offline.Replace("    onProgress?.((index + 1) / total);","    const value=(index+1)/total;onProgress?.(value);showDownloadProgress(downloadTitle,value*100);")
$offline=$offline.Replace("  await writeManifest(manifest);`n  return item;","  await writeManifest(manifest);finishDownload(downloadTitle);`n  return item;")
$offline=$offline.Replace("  const directory = juzDirectory(juz.number, reciter.id);","  const downloadTitle=`Juz ${juz.number}`;showDownloadProgress(downloadTitle,1);`n  const directory = juzDirectory(juz.number, reciter.id);")
$offline=$offline.Replace("    onProgress?.((index + 1) / Math.max(1, ayahs.length));","    const value=(index+1)/Math.max(1,ayahs.length);onProgress?.(value);showDownloadProgress(downloadTitle,value*100);")
$offline=$offline.Replace("  }`n}`n`nexport async function removeJuzOffline","  }`n  finishDownload(downloadTitle);`n}`n`nexport async function removeJuzOffline")
[IO.File]::WriteAllText($quranOfflinePath,$offline)
