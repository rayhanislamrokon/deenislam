$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
function Replace-InFile([string]$relative,[string]$old,[string]$new){$path=Join-Path $projectRoot $relative;$text=[IO.File]::ReadAllText($path).Replace($old,$new);[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))}

$component='admin-panel\app\components\AdminLanguagePicker.tsx'
$path=Join-Path $projectRoot $component
$text=[IO.File]::ReadAllText($path)
$text=$text.Replace('statusFor?:(code:string)=>string;disabled?:boolean','statusFor?:(code:string)=>string;completeFor?:(code:string)=>boolean;disabled?:boolean')
$text=$text.Replace('{value,onChange,section,statusFor,disabled}:Props','{value,onChange,section,statusFor,completeFor,disabled}:Props')
$text=$text.Replace('const active=item.code===value,status=statusFor?.(item.code)||','const active=item.code===value,complete=completeFor?completeFor(item.code):item.code==="en",status=statusFor?.(item.code)||')
$text=$text.Replace('{active?<em style={checkStyle}>{"\u2713"}</em>:null}','{complete?<em style={checkStyle}>{"\u2713"}</em>:<em style={emptyCheckStyle}/>}')
$text=$text.Replace('const checkStyle=','const emptyCheckStyle={width:20,height:20,display:"block",borderRadius:"50%",background:"#e7f0ea"} as const;'+[Environment]::NewLine+'const checkStyle=')
[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))

Replace-InFile 'admin-panel\app\hadith\page.tsx' '"Not uploaded yet"}/>' '"Not uploaded yet"} completeFor={code=>code==="en"||items.some(i=>Boolean(i.translations?.[code]))}/>'
Replace-InFile 'admin-panel\app\duas\page.tsx' '"Not uploaded yet"}/>' '"Not uploaded yet"} completeFor={code=>code==="en"||items.some(i=>Boolean(i.translations?.[code]))}/>'
Replace-InFile 'admin-panel\app\prophets\page.tsx' '"Not uploaded yet"}/>' '"Not uploaded yet"} completeFor={code=>code==="en"||items.some(x=>Boolean(x.translations?.[code]))}/>'
Replace-InFile 'admin-panel\app\islamic-lifestyle\page.tsx' '"Not uploaded yet"}/>' '"Not uploaded yet"} completeFor={code=>code==="en"||items.some(x=>Boolean(x.translations?.[code]))}/>'
Replace-InFile 'admin-panel\app\page.tsx' ':"Not uploaded yet"}}/>' ':"Not uploaded yet"}} completeFor={code=>code==="en"||library.some(book=>(book.languageCode||"en")===code)}/>'
Replace-InFile 'admin-panel\app\quran\page.tsx' '{count>0?<em>{"\u2713"}</em>:<em className="emptyMark"/>}' '{(item.code==="en"||complete)?<em>{"\u2713"}</em>:<em className="emptyMark"/>}'
