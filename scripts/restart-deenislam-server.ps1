$processes = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" | Where-Object { $_.CommandLine -match 'src/index\.js' }
foreach ($process in $processes) { Stop-Process -Id $process.ProcessId -Force }
Start-Process 'H:\Node.js\node.exe' 'src/index.js' -WorkingDirectory (Join-Path $PSScriptRoot '..\server') -WindowStyle Hidden
