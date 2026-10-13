$path = Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\RichTextEditor.tsx'
$content = [IO.File]::ReadAllText($path)
$old = @'
  const selectedList = (type: "bullet"|"number", blockAction: () => void) => {
    const {from,to,empty}=editor.state.selection;
    if(empty){blockAction();return}
    const selected=editor.state.doc.textBetween(from,to," ");
    editor.chain().focus().deleteSelection().insertContent(`${type==="bullet"?"• ":"1. "}${selected}`).run();
  };
'@
$new = @'
  const selectedList = (type: "bullet"|"number", blockAction: () => void) => {
    const selection=editor.state.selection;
    if(selection.empty){blockAction();return}
    const {from,to,$from,$to}=selection;
    if(!$from.sameParent($to)){blockAction();return}
    const startsInside=$from.parentOffset>0;
    const endsInside=$to.parentOffset<$to.parent.content.size;
    if(endsInside) editor.chain().focus().setTextSelection(to).splitBlock().run();
    if(startsInside) editor.chain().focus().setTextSelection(from).splitBlock().run();
    const selectedBlockPosition=startsInside?from+1:from;
    const chain=editor.chain().focus().setTextSelection(selectedBlockPosition);
    if(type==="bullet") chain.toggleBulletList().run();
    else chain.toggleOrderedList().run();
  };
'@
if (-not $content.Contains($old)) { throw 'selectedList helper not found.' }
$content = $content.Replace($old,$new)
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
