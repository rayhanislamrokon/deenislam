const fs = require("fs");
const file = "app/page.tsx";
let source = fs.readFileSync(file, "utf8");
source = source.replace('"tafsir-books" | "hadith" | "duas"', '"tafsir-books" |\n  "hadith" |\n  "duas"');
source = source.replace('<button className={view === "hadith" ? "active" : ""}', '\n<button className={view === "hadith" ? "active" : ""}');
source = source.replace('<button className={view === "duas" ? "active" : ""}', '\n<button className={view === "duas" ? "active" : ""}');
source = source.replace('{view === "hadith" && <section', '\n{view === "hadith" && <section');
source = source.replace('{view === "duas" && <section', '\n{view === "duas" && <section');
fs.writeFileSync(file, source);
