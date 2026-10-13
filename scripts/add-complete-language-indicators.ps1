$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

function Edit([string]$relative,[scriptblock]$change){
  $path=Join-Path $projectRoot $relative
  $text=[IO.File]::ReadAllText($path)
  $text=& $change $text
  [IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))
}

Edit 'admin-panel\app\components\AdminLanguagePicker.tsx' {
 param($text)
 $text=$text.Replace('statusFor?:(code:string)=>string;disabled?:boolean','statusFor?:(code:string)=>string;completeFor?:(code:string)=>boolean;disabled?:boolean')
 $text=$text.Replace('{value,onChange,section,statusFor,disabled}:Props','{value,onChange,section,statusFor,completeFor,disabled}:Props')
 $text=$text.Replace('const active=item.code===value,status=statusFor?.(item.code)||', 'const active=item.code===value,complete=completeFor?completeFor(item.code):item.code==="en",status=statusFor?.(item.code)||')
 $text=$text.Replace('{active?<em style={checkStyle}>{"\u2713"}</em>:null}', '{complete?<em style={checkStyle}>{"\u2713"}</em>:<em style={emptyCheckStyle}/>}')
 $text=$text.Replace('const checkStyle=', 'const emptyCheckStyle={width:20,height:20,display:"block",borderRadius:"50%",background:"#e7f0ea"} as const;' + [Environment]::NewLine + 'const checkStyle=')
 return $text
}

$pages=@(
 @{Path='admin-panel\app\hadith\page.tsx'; Find='statusFor={code=>code==="en"?"Original English content Â· Available":form.id&&items.find(i=>i.id===form.id)?.translations?.[code]?"Translation saved":"Not uploaded yet"}'; Add='statusFor={code=>code==="en"?"Original English content - Available":form.id&&items.find(i=>i.id===form.id)?.translations?.[code]?"Translation saved":"Not uploaded yet"} completeFor={code=>code==="en"||items.some(i=>Boolean(i.translations?.[code]))}'},
 @{Path='admin-panel\app\duas\page.tsx'; Find='statusFor={code=>code==="en"?"Original English content Â· Available":form.id&&items.find(i=>i.id===form.id)?.translations?.[code]?"Translation saved":"Not uploaded yet"}'; Add='statusFor={code=>code==="en"?"Original English content - Available":form.id&&items.find(i=>i.id===form.id)?.translations?.[code]?"Translation saved":"Not uploaded yet"} completeFor={code=>code==="en"||items.some(i=>Boolean(i.translations?.[code]))}'},
 @{Path='admin-panel\app\prophets\page.tsx'; Find='statusFor={code=>code==="en"?"Original English content Â· Available":items.some(x=>x.translations?.[code])?`${items.filter(x=>x.translations?.[code]).length} Prophets translated`:"Not uploaded yet"}'; Add='statusFor={code=>code==="en"?"Original English content - Available":items.some(x=>x.translations?.[code])?`${items.filter(x=>x.translations?.[code]).length} Prophets translated`:"Not uploaded yet"} completeFor={code=>code==="en"||items.some(x=>Boolean(x.translations?.[code]))}'},
 @{Path='admin-panel\app\islamic-lifestyle\page.tsx'; Find='statusFor={code=>code==="en"?"Original English content Â· Available":items.some(x=>x.translations?.[code])?`${items.filter(x=>x.translations?.[code]).length} items translated`:"Not uploaded yet"}'; Add='statusFor={code=>code==="en"?"Original English content - Available":items.some(x=>x.translations?.[code])?`${items.filter(x=>x.translations?.[code]).length} items translated`:"Not uploaded yet"} completeFor={code=>code==="en"||items.some(x=>Boolean(x.translations?.[code]))}'},
 @{Path='admin-panel\app\page.tsx'; Find='return count?`${count} ${count===1?"book":"books"} uploaded`:"Not uploaded yet"}}'; Add='return count?`${count} ${count===1?"book":"books"} uploaded`:"Not uploaded yet"}} completeFor={code=>code==="en"||library.some(book=>(book.languageCode||"en")===code)}'}
)
foreach($page in $pages){Edit $page.Path {param($text) $text.Replace($page.Find,$page.Add)}}

Edit 'admin-panel\app\quran\page.tsx' {
 param($text)
 $text.Replace('{count>0?<em>{"\u2713"}</em>:<em className="emptyMark"/>}', '{(item.code==="en"||complete)?<em>{"\u2713"}</em>:<em className="emptyMark"/>}')
}
