$path = Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\RichTextEditor.tsx'
$content = [IO.File]::ReadAllText($path)
$old = 'return { tone: { default: "gold", parseHTML: element => element.getAttribute("data-tone") || "gold" } };'
$new = 'return { tone: { default: "gold", parseHTML: element => element.getAttribute("data-tone") || "gold", renderHTML: attributes => ({ "data-tone": attributes.tone || "gold" }) } };'
$first = $content.IndexOf('const InlineQuote')
$last = $content.IndexOf('const ColoredBlockquote')
if ($first -lt 0 -or $last -lt 0) { throw 'InlineQuote extension not found.' }
$prefix = $content.Substring(0,$first)
$inline = $content.Substring($first,$last-$first)
$suffix = $content.Substring($last)
if (-not $inline.Contains($old)) { throw 'Inline quote tone attribute not found.' }
$inline = $inline.Replace($old,$new)
$content = $prefix+$inline+$suffix
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
