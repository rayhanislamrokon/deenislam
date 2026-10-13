$path='server/src/lifestyle-admin.js'
$text=Get-Content -Raw $path
$text=$text.Replace("const list=(value,max=30)=>Array.isArray(value)?value.slice(0,max).map(x=>clean(x,1200)).filter(Boolean):[];","const list=(value,max=30,maxChars=1200)=>Array.isArray(value)?value.slice(0,max).map(x=>clean(x,maxChars)).filter(Boolean):[];")
$text=$text.Replace('introduction:list(body.introduction,12),','introduction:list(body.introduction,12,50000),')
Set-Content -Path $path -Value $text -Encoding utf8
