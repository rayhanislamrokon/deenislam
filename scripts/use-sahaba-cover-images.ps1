$path = Join-Path $PSScriptRoot '..\src\screens\BooksScreen.tsx'
$text = [IO.File]::ReadAllText($path)
$text = $text.Replace('ActivityIndicator,Alert,Linking,Pressable,ScrollView,StyleSheet,Text,TextInput,View','ActivityIndicator,Alert,Image,Linking,Pressable,ScrollView,StyleSheet,Text,TextInput,View')
$text = $text.Replace('publicDomain?:boolean};','publicDomain?:boolean;coverImageUrl?:string};')
$text = $text.Replace('source:item.sourceUrl,publicDomain:item.publicDomain}', 'source:item.sourceUrl,publicDomain:item.publicDomain,coverImageUrl:item.coverImageUrl}')
$openMarker = "const open=(x:Book)=>"
$helper = "const isSahabaBook=(x:Book)=>['Sahaba','Male Sahaba','Female Sahabiyat'].includes(x.category),coverSource=(x:Book)=>x.coverImageUrl?{uri:x.coverImageUrl}:x.category==='Female Sahabiyat'?require('../../assets/sahabiyat-female-cover.png'):require('../../assets/sahaba-male-cover.png');"
if (-not $text.Contains($openMarker)) { throw 'Book open marker not found' }
$text = $text.Replace($openMarker,$helper+$openMarker)
$oldCover = '<Text style={s.coverMark}>{x.mark}</Text><Text style={s.coverCategory}>{x.category}</Text><Pressable onPress={()=>toggleBookBookmark(x)} style={s.bookmark}>'
$newCover = '{isSahabaBook(x)?<><Image source={coverSource(x)} resizeMode="cover" style={s.coverImage}/><View style={s.coverShade}/></>:<Text style={s.coverMark}>{x.mark}</Text>}<Text style={[s.coverCategory,isSahabaBook(x)&&s.coverCategoryImage]}>{x.category}</Text><Pressable onPress={()=>toggleBookBookmark(x)} style={s.bookmark}>'
if (-not $text.Contains($oldCover)) { throw 'Book cover markup not found' }
$text = $text.Replace($oldCover,$newCover)
$styleMarker = 'coverMark:{paddingHorizontal:10,fontSize:19,lineHeight:29,textAlign:'
$styleInsert = "coverImage:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%'},coverShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(5,52,35,.10)'},coverCategoryImage:{position:'absolute',left:8,right:8,bottom:9,marginTop:0,paddingVertical:5,borderRadius:8,overflow:'hidden',backgroundColor:'rgba(255,255,255,.90)',textAlign:'center',fontWeight:'700'},"
if (-not $text.Contains($styleMarker)) { throw 'Cover style marker not found' }
$text = $text.Replace($styleMarker,$styleInsert+$styleMarker)
[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))
