$path = Join-Path $PSScriptRoot '..\server\src\index.js'
$content = [IO.File]::ReadAllText((Resolve-Path $path), [Text.Encoding]::UTF8)
$content = $content.Replace("const{createLifestyleRouter}=require('./lifestyle-admin');", "const{createLifestyleRouter}=require('./lifestyle-admin');`r`nconst{createProphetsRouter}=require('./prophets-admin');")
$content = $content.Replace('let users,surahs,books,lifestyleContent,appSettings', 'let users,surahs,books,lifestyleContent,prophetsContent,appSettings')
$content = $content.Replace('app.use(createLifestyleRouter(()=>lifestyleContent,process.env.ADMIN_API_KEY,jwtSecret));', 'app.use(createLifestyleRouter(()=>lifestyleContent,process.env.ADMIN_API_KEY,jwtSecret));`r`napp.use(createProphetsRouter(()=>prophetsContent,process.env.ADMIN_API_KEY,jwtSecret));')
$content = $content.Replace("lifestyleContent=db.collection('islamic_lifestyle');", "lifestyleContent=db.collection('islamic_lifestyle');prophetsContent=db.collection('prophets_content');")
$content = $content.Replace("await lifestyleContent.createIndex({published:1,category:1,order:1});", "await lifestyleContent.createIndex({published:1,category:1,order:1});await prophetsContent.createIndex({slug:1},{unique:true});await prophetsContent.createIndex({published:1,order:1});")
[IO.File]::WriteAllText((Resolve-Path $path), $content, [Text.UTF8Encoding]::new($false))
