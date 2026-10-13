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
for (const segment of input.segments || []) for (const category of segment.categories || []) for (const title of category.titles || []) for (const item of title.duas || []) all.push({ label: title.title_name, category: category.category_name, ...item });
const seen = new Set(existing);
const selected = all.filter(item => {
  const key = normalize(item.arabic);
  if (!key || !item.latin || !item.translation || seen.has(key)) return false;
  seen.add(key);
  return true;
});
const totals = new Map();
const indexes = new Map();
for (const item of selected) totals.set(item.label, (totals.get(item.label) || 0) + 1);
for (const item of selected) if (totals.get(item.label) > 1) {
  const number = (indexes.get(item.label) || 0) + 1;
  indexes.set(item.label, number);
  item.label = `${item.label} ${number}`;
}
const rows = selected.map(item => `  ${JSON.stringify({ label: item.label, arabic: item.arabic, meaning: item.translation, names: [item.label, item.latin], source: item.source || '' })},`).join('\n');
const output = `import type { ZikrPreset } from './zikrPresets';\n\n// Remaining offline Hisnul Muslim entries; generated without Arabic duplicates.\nexport const HISNUL_MUSLIM_REMAINING: ZikrPreset[] = [\n${rows}\n];\n`;
fs.writeFileSync('src/data/hisnulMuslimRemaining.ts', output, 'utf8');
console.log(`Generated ${selected.length} additional unique duas.`);
