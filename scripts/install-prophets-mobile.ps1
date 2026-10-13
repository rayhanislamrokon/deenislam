$root = Join-Path $PSScriptRoot '..'
Copy-Item -LiteralPath (Join-Path $root 'src\screens\ProphetsListScreen.new.tsx') -Destination (Join-Path $root 'src\screens\ProphetsListScreen.tsx') -Force
Copy-Item -LiteralPath (Join-Path $root 'src\screens\ProphetDetailScreen.new.tsx') -Destination (Join-Path $root 'src\screens\ProphetDetailScreen.tsx') -Force
$appPath = Join-Path $root 'App.tsx'
$app = [IO.File]::ReadAllText((Resolve-Path $appPath), [Text.Encoding]::UTF8)
$app = $app.Replace('<ProphetsListScreen onBack={() => setScreen(''home'')} onOpen={(name) =>', '<ProphetsListScreen language={selectedLanguage} onBack={() => setScreen(''home'')} onOpen={(name) =>')
$app = $app.Replace('<ProphetDetailScreen name={selectedProphetName}', '<ProphetDetailScreen language={selectedLanguage} name={selectedProphetName}')
[IO.File]::WriteAllText((Resolve-Path $appPath), $app, [Text.UTF8Encoding]::new($false))
