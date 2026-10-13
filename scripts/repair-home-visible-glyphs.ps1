$target = Join-Path $PSScriptRoot '..\src\screens\HomeScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = [regex]::Replace($source, '<Text style=\{s\.green\}>.*?</Text>', '<Text style={s.green}>{"\u2630"}</Text>', 1)
$source = [regex]::Replace($source, '<Text style=\{s\.name\}>Ahmed .*?</Text>', '<Text style={s.name}>Ahmed {"\uD83D\uDC4B"}</Text>', 1)
$source = [regex]::Replace($source, '<Text style=\{s\.location\}>.*?\{c\.location\}.*?</Text>', '<Text style={s.location}>{"\u2316"}  {c.location}</Text>', 1)
$source = [regex]::Replace($source, '<Text style=\{s\.more\}>\{c\.viewAll\}.*?</Text>', '<Text style={s.more}>{c.viewAll}  {"\u203A"}</Text>', 1)
$source = [regex]::Replace($source, '<Text style=\{s\.coverMark\}>.*?</Text>', '<Text style={s.coverMark}>{"\u06DE"}</Text>', 1)
$source = [regex]::Replace($source, '<Text style=\{s\.coverText\}>.*?</Text>', '<Text style={s.coverText}>{"\u0627\u0644\u0642\u0631\u0622\u0646"}</Text>', 1)
$source = [regex]::Replace($source, '<Text style=\{s\.white\}>.*?</Text>', '<Text style={s.white}>{"\u25B6"}</Text>', 1)
$source = [regex]::Replace($source, '<Text style=\{s\.star\}>.*?</Text>', '<Text style={s.star}>{"\u2726"}</Text>')
$source = [regex]::Replace($source, '<Text style=\{s\.arrow\}>.*?</Text>', '<Text style={s.arrow}>{"\u203A"}</Text>')
$source = [regex]::Replace($source, '<Text style=\{s\.languageCloseText\}>.*?</Text>', '<Text style={s.languageCloseText}>{"\u00D7"}</Text>')
$source = [regex]::Replace($source, '<Text style=\{s\.languageSearchIcon\}>.*?</Text>', '<Text style={s.languageSearchIcon}>{"\u2315"}</Text>')
$source = [regex]::Replace($source, '<Text style=\{s\.languageArrow\}>.*?</Text>', '<Text style={s.languageArrow}>{"\u203A"}</Text>')
$source = [regex]::Replace($source, '<Text style=\{cal\.arrowText\}>.*?</Text>', '<Text style={cal.arrowText}>{"\u2039"}</Text>', 1)
$arrowMatches = [regex]::Matches($source, '<Text style=\{cal\.arrowText\}>.*?</Text>')
if ($arrowMatches.Count -gt 1) { $match=$arrowMatches[1];$source=$source.Remove($match.Index,$match.Length).Insert($match.Index,'<Text style={cal.arrowText}>{"\u203A"}</Text>') }
Set-Content -LiteralPath $target -Value $source -Encoding utf8
