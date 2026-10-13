$target = Join-Path $PSScriptRoot '..\admin-panel\app\prophets\preview\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace('const token=localStorage.getItem("adminToken")||localStorage.getItem("token")||"";', 'const token=sessionStorage.getItem("deenislam_admin_token")||"";')
$source = $source.Replace('${API}/api/admin/prophets?language=${encodeURIComponent(language)}', '${API}/api/admin/prophets')
$old = 'setItem(found)}catch(reason:any)'
$new = 'const translated=language==="en"?found:found.translations?.[language];if(language!=="en"&&!translated)throw new Error("This language has no saved translation");setItem({...found,...translated,parts:translated?.parts||found.parts||[]})}catch(reason:any)'
if (-not $source.Contains($old)) { throw 'Preview data marker not found' }
$source = $source.Replace($old,$new)
Set-Content -LiteralPath $target -Value $source -NoNewline
