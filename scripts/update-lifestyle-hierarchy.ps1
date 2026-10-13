$path = 'J:\REACT NATIVE APPS\DeenIslam\server\src\lifestyle-admin.js'
$s = [IO.File]::ReadAllText($path)
$s = $s.Replace("slug:item.slug,category:item.category,title:item.title", "slug:item.slug,kind:item.kind||'chapter',section:item.section||'General Muslim Life',parentCategorySlug:item.parentCategorySlug||'',category:item.category,title:item.title")
$s = $s.Replace("const payload=body=>({category:clean(body.category,80)||'General Muslim Life',title:", "const payload=body=>({kind:body.kind==='category'?'category':'chapter',section:clean(body.section,80)||'General Muslim Life',parentCategorySlug:slugify(body.parentCategorySlug),category:clean(body.category,80)||'General Muslim Life',title:")
$s = $s.Replace('.sort({category:1,order:1,title:1})', '.sort({section:1,parentCategorySlug:1,order:1,title:1})')
$old = '<div class="grid"><label>Category<input id="category" required placeholder="General Muslim Life"></label><label>Display order'
$new = '<div class="grid"><label>Content type<select id="kind"><option value="category">Category card</option><option value="chapter">Chapter inside category</option></select></label><label>Section<input id="section" required value="General Muslim Life"></label><label>Parent category slug<input id="parentCategorySlug" placeholder="Required for chapters only"></label><label>Display order'
$s = $s.Replace($old, $new)
$s = $s.Replace('input,textarea{', 'input,textarea,select{')
$s = $s.Replace("body={category:e('category').value,order:", "body={kind:e('kind').value,section:e('section').value,parentCategorySlug:e('parentCategorySlug').value,category:e('section').value,order:")
$s = $s.Replace("['id','category','order','title'", "['id','kind','section','parentCategorySlug','order','title'")
$s = $s.Replace("const h=x.category!==last?'<h3>'+esc(last=x.category)", "const h=x.section!==last?'<h3>'+esc(last=x.section)")
[IO.File]::WriteAllText($path, $s, (New-Object Text.UTF8Encoding($false)))
