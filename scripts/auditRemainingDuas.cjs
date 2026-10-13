const fs = require('fs');
const ts = require('typescript');
const files = ['src/data/zikrPresets.ts', 'src/data/additionalDuas.ts', 'src/data/moreDuas.ts', 'src/data/hisnulMuslim100.ts'];
const normalize = value => String(value || '').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\sـ]/g, '');
const existing = new Set();
for (const file of files) {
  const tree = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = node => {
    if (ts.isPropertyAssignment(node) && node.name.getText(tree).replace(/['"]/g, '') === 'arabic' && ts.isStringLiteral(node.initializer)) existing.add(normalize(node.initializer.text));
    if (ts.isArrayLiteralExpression(node) || ts.isCallExpression(node)) {
      const values = ts.isArrayLiteralExpression(node) ? node.elements : node.arguments;
      if (values.length > 1 && ts.isStringLiteral(values[1]) && /\p{Script=Arabic}/u.test(values[1].text)) existing.add(normalize(values[1].text));
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
}
const input = JSON.parse(fs.readFileSync('.tmp-hisnul-muslim.json', 'utf8'));
const all = [];
for (const segment of input.segments || []) for (const category of segment.categories || []) for (const title of category.titles || []) for (const item of title.duas || []) all.push({ title: title.title_name, ...item });
const seen = new Set(existing);
const remaining = all.filter(item => {
  const key = normalize(item.arabic);
  if (!key || !item.latin || !item.translation || seen.has(key)) return false;
  seen.add(key);
  return true;
});
console.log(JSON.stringify({ datasetEntries: all.length, existingUniqueArabic: existing.size, additionalUniqueAvailable: remaining.length, sampleTitles: [...new Set(remaining.map(item => item.title))].slice(0, 20) }, null, 2));
