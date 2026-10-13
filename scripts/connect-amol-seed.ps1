$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$path=Join-Path $root 'server\src\index.js'
$source=[IO.File]::ReadAllText($path)
if($source -notmatch 'seedAmolContent'){$source=$source.Replace("const{seedSahabaBiographies}=require('./sahaba-seed');","const{seedSahabaBiographies}=require('./sahaba-seed');"+[Environment]::NewLine+"const{seedAmolContent}=require('./amol-seed');");$source=$source.Replace('await seedSahabaBiographies(books);','await seedSahabaBiographies(books);await seedAmolContent(books);')}
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
