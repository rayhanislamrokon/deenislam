$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$path = Join-Path $projectRoot 'admin-panel\app\components\AdminLanguagePicker.tsx'
$source = [IO.File]::ReadAllText($path)

$source = $source.Replace('style={modalStyle}><header style={headStyle}>', 'style={modalStyle}><div style={headStyle}>')
$source = $source.Replace('</div><button type="button" onClick={close} style={closeStyle}>×</button></header><label style={searchStyle}>', '</div><button type="button" onClick={close} style={closeStyle}>×</button></div><label style={searchStyle}>')
$source = $source.Replace('padding:"8px 12px"', 'padding:"10px 14px"')
$source = $source.Replace('width:40,height:40,display:', 'width:44,height:44,display:')
$source = $source.Replace('width:"min(560px,100%)",maxHeight:"88vh",display:"flex",flexDirection:"column",padding:22,borderRadius:24', 'position:"relative",width:"min(620px,calc(100vw - 32px))",maxHeight:"min(760px,calc(100vh - 32px))",display:"flex",flexDirection:"column",padding:26,borderRadius:24')
$source = $source.Replace('display:"flex",alignItems:"flex-start",justifyContent:"space-between",background:"transparent",padding:0', 'width:"100%",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:20,flex:"0 0 auto",background:"transparent",padding:"0 58px 0 0"')
$source = $source.Replace('width:40,height:40,padding:0,border:0,borderRadius:"50%"', 'position:"absolute",right:22,top:22,width:42,height:42,padding:0,border:0,borderRadius:"50%"')
$source = $source.Replace('height:50,display:', 'height:54,display:')
$source = $source.Replace('display:"grid",gap:8,marginTop:14,paddingRight:4,overflowY:"auto"', 'minHeight:0,maxHeight:470,display:"grid",gap:10,marginTop:16,paddingRight:7,overflowY:"auto",overscrollBehavior:"contain"')
$source = $source.Replace('gap:12,padding:"11px 13px"', 'gap:14,minHeight:66,padding:"11px 15px"')
$source = $source.Replace('fontSize:14}}>{item.label}', 'fontSize:15}}>{item.label}')
$source = $source.Replace('fontSize:10}}>{status}', 'fontSize:11,lineHeight:1.35}}>{status}')

[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
