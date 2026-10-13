$page='admin-panel/app/islamic-lifestyle/page.tsx'
$text=Get-Content -Raw $page
$text=$text.Replace('Category and its chapters deleted successfully.','Category deleted successfully.')
Set-Content -Path $page -Value $text -Encoding utf8

$server='server/src/lifestyle-admin.js'
$serverText=Get-Content -Raw $server
$old="const result=await getCollection().deleteOne({_id:new ObjectId(req.params.id)});if(!result.deletedCount)return res.status(404).json({message:'Chapter not found.'});res.json({message:'Chapter deleted.'})"
$new="const collection=getCollection(),existing=await collection.findOne({_id:new ObjectId(req.params.id)});if(!existing)return res.status(404).json({message:'Content not found.'});if(existing.kind==='category'&&await collection.countDocuments({kind:'chapter',parentCategorySlug:existing.slug}))return res.status(409).json({message:'Delete the chapters inside this category first.'});await collection.deleteOne({_id:existing._id});res.json({message:existing.kind==='category'?'Category deleted.':'Chapter deleted.'})"
if(-not $serverText.Contains($old)){throw 'Delete endpoint was not found'}
$serverText=$serverText.Replace($old,$new)
Set-Content -Path $server -Value $serverText -Encoding utf8
