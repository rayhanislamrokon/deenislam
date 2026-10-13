$target = Join-Path $PSScriptRoot '..\src\screens\QuranScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = [regex]::Replace($source, '<Text style=\{styles\.coverOrnament\}>.*?</Text>', '<Text style={styles.coverOrnament}>{"\u06DE"}</Text>')
$source = [regex]::Replace($source, '<Text style=\{styles\.coverArabic\}>.*?</Text>', '<Text style={styles.coverArabic}>{"\u0627\u0644\u0642\u0631\u0622\u0646"}</Text>')
$source = [regex]::Replace($source, '<Text style=\{styles\.viewAll\}>\{t\.viewAll\}.*?</Text>', '<Text style={styles.viewAll}>{t.viewAll} {"\u203A"}</Text>')
$source = [regex]::Replace($source, '<Text style=\{styles\.roundArabic\}>.*?</Text></View><View style=\{\{flex:1\}\}><Text style=\{styles\.recentName\}>\{language===\x27bn\x27\?bengaliTransliteration\(\x27Yasin\x27\):\x27Yasin\x27\}</Text>', '<Text style={styles.roundArabic}>{"\u064A\u0633"}</Text></View><View style={{flex:1}}><Text style={styles.recentName}>{language==="bn"?bengaliTransliteration("Yasin"):"Yasin"}</Text>', 1)
$source = [regex]::Replace($source, '<Text style=\{styles\.roundArabic\}>.*?</Text></View><View style=\{\{flex:1\}\}><Text style=\{styles\.recentName\}>\{language===\x27bn\x27\?bengaliTransliteration\(\x27Al-Mulk\x27\):\x27Al-Mulk\x27\}</Text>', '<Text style={styles.roundArabic}>{"\u0627\u0644\u0645\u0644\u0643"}</Text></View><View style={{flex:1}}><Text style={styles.recentName}>{language==="bn"?bengaliTransliteration("Al-Mulk"):"Al-Mulk"}</Text>', 1)
$source = [regex]::Replace($source, '<Text style=\{styles\.sheetCloseText\}>.*?</Text>', '<Text style={styles.sheetCloseText}>{"\u00D7"}</Text>')
$source = [regex]::Replace($source, '<Text style=\{styles\.sheetArrow\}>.*?</Text>', '<Text style={styles.sheetArrow}>{"\u203A"}</Text>')
Set-Content -LiteralPath $target -Value $source -Encoding utf8
