$page = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\islamic-lifestyle\page.tsx'
$s = [IO.File]::ReadAllText($page)
$s = $s.Replace('.cat>px}.cat div:nth-child(2){flex:1}', '.cat div:nth-child(2){flex:1}')
[IO.File]::WriteAllText($page, $s, (New-Object Text.UTF8Encoding($false)))

$main = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\page.tsx'
$m = [IO.File]::ReadAllText($main)
$m = $m.Replace('onClick={()=>window.open(api+"/admin/islamic-lifestyle","_blank")}', 'onClick={()=>window.location.href="/islamic-lifestyle"}')
[IO.File]::WriteAllText($main, $m, (New-Object Text.UTF8Encoding($false)))
