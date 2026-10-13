$path = Join-Path $PSScriptRoot '..\admin-panel\app\team\page.tsx'
$text = [IO.File]::ReadAllText($path)
$marker = 'const blank={email:"",password:"",role:"moderator",permissions:defaults.moderator};'
$helper = $marker + "`n" + 'async function responseBody(response:Response){const type=response.headers.get("content-type")||"";if(!type.includes("application/json"))throw Error("Admin API is not updated yet. Restart the backend server, then refresh this page.");return response.json()}'
if (-not $text.Contains('async function responseBody(')) { $text = $text.Replace($marker, $helper) }
$text = $text.Replace('j=await r.json();if(!r.ok)', 'j=await responseBody(r);if(!r.ok)')
[IO.File]::WriteAllText($path, $text, [Text.UTF8Encoding]::new($false))
