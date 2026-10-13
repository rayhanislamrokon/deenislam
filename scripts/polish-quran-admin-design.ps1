$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace('â€¹ Back to Dashboard','← Back to Dashboard').Replace('â€º','→').Replace('â€”','—').Replace('â€¦','…')
$source = $source.Replace('placeholder="Example: à¦†à¦²-à¦«à¦¾à¦¤à¦¿à¦¹à¦¾"','placeholder="Example: Localized Surah name"').Replace('placeholder="Example: à¦¸à§‚à¦šà¦¨à¦¾"','placeholder="Example: The Opening"')
$marker = '</style></main>'
$polish = @'
<style jsx>{`
main{position:relative;background:radial-gradient(circle at 88% 5%,#e1f2e7 0,transparent 28%),linear-gradient(180deg,#f8fbf8 0,#eef6f0 100%)}
header{position:relative;overflow:hidden;align-items:center;padding:30px 34px;border:1px solid rgba(255,255,255,.13);background:linear-gradient(135deg,#064b32 0%,#08704a 62%,#0a8255 100%);box-shadow:0 18px 42px rgba(7,91,59,.18)}
header:after{content:"114";position:absolute;right:125px;top:-40px;color:rgba(255,255,255,.055);font:900 150px/1 Georgia,serif;pointer-events:none}
header a{display:inline-flex;align-items:center;padding:7px 10px;border-radius:9px;background:rgba(255,255,255,.1);transition:.2s ease}header a:hover{background:rgba(255,255,255,.18);transform:translateX(-2px)}
header h1{font:700 34px/1.15 Georgia,serif;letter-spacing:-.5px}header>b{position:relative;z-index:1;min-width:90px;padding:16px;border:1px solid rgba(255,255,255,.16);border-radius:18px;background:rgba(255,255,255,.1);backdrop-filter:blur(8px)}
.message{border:1px solid #bfe0c9;box-shadow:0 7px 20px rgba(23,61,46,.06);animation:messageIn .25s ease}@keyframes messageIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
.steps{gap:8px;padding:10px;border:0;background:rgba(255,255,255,.8);box-shadow:0 8px 24px rgba(23,61,46,.07);backdrop-filter:blur(8px)}
.steps b{width:auto;flex:1;min-width:145px;padding:11px 13px;border-radius:11px;background:#f3f8f4}.steps b:first-child{background:#e2f3e7}.steps b:before{width:27px;height:27px;display:grid;place-items:center;flex:0 0 auto;border-radius:9px;background:#087a4d;color:#fff;content:"✓";font-size:11px}.steps i{padding:0 3px;color:#a4b6aa}
.workspace{padding:26px;border-color:#dce9df;box-shadow:0 18px 50px rgba(24,67,49,.09)}
.controls{padding:18px;border:1px solid #d2e5d8;border-radius:18px;background:linear-gradient(135deg,#eff8f2,#f9fcfa)}
.controls label,.meta label{color:#244b3a}.controls select,.meta input{height:46px;border-color:#c3d9ca;box-shadow:0 2px 5px rgba(23,61,46,.025);transition:border-color .2s,box-shadow .2s,background .2s}.controls select:hover,.meta input:hover{background:#fff;border-color:#93bda2}.controls select:focus,.meta input:focus,.copy textarea:focus,.ayahHead input:focus{outline:0;border-color:#087a4d;box-shadow:0 0 0 4px rgba(8,122,77,.1)}
.progress{padding:11px 14px;border:1px solid #d5e6da;border-radius:13px;background:#fff}.progress div{height:9px}.progress div i{border-radius:9px;background:linear-gradient(90deg,#087a4d,#20a76d);transition:width .35s ease}
.meta{padding:16px;border:1px solid #e0ebe3;border-radius:16px;background:#fff}
details{padding:16px 17px;border-style:solid;border-color:#d5e5da;background:linear-gradient(180deg,#fbfdfb,#f4faf6);transition:border-color .2s,box-shadow .2s}details[open]{border-color:#9ac3a7;box-shadow:0 7px 20px rgba(23,61,46,.06)}summary{padding:3px;list-style:none}summary:after{content:"+";float:right;width:25px;height:25px;display:grid;place-items:center;border-radius:8px;background:#e0f1e5}details[open] summary:after{content:"−"}
.ayahHead{padding-bottom:13px;border-bottom:1px solid #e1ebe4}.ayahHead h2{font:700 25px Georgia,serif}.ayahHead input{height:43px;background:#f9fcfa;transition:.2s}
.ayahs{gap:15px}.ayahs article{position:relative;padding:20px;border-color:#dce9df;border-radius:19px;background:#fff;box-shadow:0 5px 16px rgba(23,61,46,.045);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}.ayahs article:hover{transform:translateY(-2px);border-color:#a6cdb2;box-shadow:0 12px 28px rgba(23,61,46,.09)}
.number{width:46px;height:46px;border-radius:15px;background:linear-gradient(145deg,#087a4d,#075b3b);box-shadow:0 6px 14px rgba(8,122,77,.22)}
.copy>p{padding:4px 6px 16px;border-bottom:1px solid #edf2ee;font-size:28px}.copy blockquote{margin-top:8px;padding:13px 15px;border:1px solid #eee2b9;border-left:4px solid #d3b44e;border-radius:10px;background:linear-gradient(135deg,#fff9e8,#fffdf5);line-height:1.65}.copy textarea{padding:13px;line-height:1.6;background:#fbfdfb;transition:.2s}
footer{z-index:3;margin:24px -26px -26px;padding:17px 26px;border-radius:0 0 20px 20px;background:rgba(245,250,246,.94);box-shadow:0 -8px 25px rgba(23,61,46,.06);backdrop-filter:blur(12px)}footer button{min-width:210px;padding:13px 19px;background:linear-gradient(135deg,#087a4d,#075b3b);box-shadow:0 7px 18px rgba(8,122,77,.2);transition:.2s ease}footer button:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(8,122,77,.27)}
@media(max-width:800px){header{padding:23px}header:after{display:none}.workspace{padding:16px}.steps b{min-width:135px}.meta{padding:12px}.ayahs article{padding:14px}.copy>p{font-size:24px}footer{margin:18px -16px -16px;padding:14px 16px}}
`}</style>
'@
if (-not $source.Contains($marker)) { throw 'Quran style closing marker not found' }
$source = $source.Replace($marker,$polish.TrimEnd()+$marker)
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
