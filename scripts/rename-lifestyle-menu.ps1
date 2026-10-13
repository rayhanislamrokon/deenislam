$main = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\page.tsx'
$s = [IO.File]::ReadAllText($main)
$s = $s.Replace('<span>Lifestyle Content</span>', '<span>Categories</span>')
[IO.File]::WriteAllText($main, $s, (New-Object Text.UTF8Encoding($false)))

$page = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\islamic-lifestyle\page.tsx'
$p = [IO.File]::ReadAllText($page)
$p = $p.Replace('<h1>Islamic Lifestyle</h1>', '<h1>Lifestyle Categories</h1>')
$p = $p.Replace('Create category cards first, then add chapters inside each category.', 'Create and organize app categories, then add chapters inside each category.')
[IO.File]::WriteAllText($page, $p, (New-Object Text.UTF8Encoding($false)))
