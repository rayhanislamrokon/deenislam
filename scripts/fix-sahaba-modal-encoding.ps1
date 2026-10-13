$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$path = Join-Path $projectRoot 'admin-panel\app\sahaba\page.tsx'
$source = [IO.File]::ReadAllText($path)

$source = [regex]::Replace($source,'(<button type="button" onClick=\{\(\)=>\{setLanguageOpen\(false\);setLanguageSearch\(""\)\}\}>).*?(</button>)','$1{"\u00D7"}$2',1)
$source = [regex]::Replace($source,'(<label className="languageSearch"><span>).*?(</span><input)','$1{"\u2315"}$2',1)
$source = [regex]::Replace($source,'languages uploaded.*?195 available','languages uploaded - 195 available',1)
$source = [regex]::Replace($source,'\{count>0\?<em>.*?</em>:<em className="emptyMark"/>\}','{count>0?<em>{"\u2713"}</em>:<em className="emptyMark"/>}',1)
$source = [regex]::Replace($source,'(<strong>).*?(</strong></button>\}\)\}</div></section></div>)','$1{"\u203A"}$2',1)
$source = [regex]::Replace($source,'(<button type="button" className="languagePicker".*?<strong>).*?(</strong></button>)','$1{"\u203A"}$2',1)

[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
