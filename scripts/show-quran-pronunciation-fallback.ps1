$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw -Encoding utf8
$source = $source.Replace('import{useEffect,useMemo,useState}from"react";', 'import{useEffect,useMemo,useState}from"react";'+[Environment]::NewLine+'import{bengaliTransliteration}from"./bengaliTransliteration";')
$old = 'language==="en"?(a.transliteration||""):(a.pronunciations?.[language]||"")'
$new = 'language==="en"?(a.transliteration||""):(a.pronunciations?.[language]||(language==="bn"?bengaliTransliteration(a.transliteration||""):(a.transliteration||"")))'
$source = $source.Replace($old,$new)
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
