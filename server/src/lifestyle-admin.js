const express = require("express");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

const clean = (value, max = 1000) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const list = (value, max = 30, maxChars = 1200) =>
  Array.isArray(value)
    ? value
        .slice(0, max)
        .map((x) => clean(x, maxChars))
        .filter(Boolean)
    : [];
const slugify = (value) =>
  clean(value, 120)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");
const languageCode = (value) => {
  const code = clean(value, 20);
  return /^[a-z]{2,3}(?:-[A-Za-z]{2,8})?$/.test(code) ? code : "en";
};
const sharedCategories = [
  ["aqidah", "Aqidah", "Foundations of faith and belief", "☪️"],
  [
    "fiqh-of-worship",
    "Fiqh of Worship",
    "Practical guidance for daily worship",
    "🕌",
  ],
  [
    "family-and-character",
    "Family and Character",
    "Mercy, responsibility and beautiful character",
    "👨‍👩‍👧",
  ],
  ["halal-living", "Halal Living", "Ethical choices for everyday life", "🌿"],
  [
    "islamic-manners",
    "Islamic Manners",
    "Adab in speech, conduct and relationships",
    "🤲",
  ],
  [
    "community-responsibility",
    "Community Responsibility",
    "Service, justice and care for others",
    "🤝",
  ],
];
const ensureSharedCategories = async (collection) => {
  const now = new Date();
  await collection.bulkWrite(
    sharedCategories.map(([slug, title, subtitle, icon], index) => ({
      updateOne: {
        filter: { slug },
        update: {
          $set: { icon, updatedAt: now },
          $setOnInsert: {
            slug,
            kind: "category",
            section: "Core Islamic Living",
            parentCategorySlug: "",
            category: "Core Islamic Living",
            title,
            subtitle,
            order: index + 1,
            published: true,
            quran: null,
            introduction: [],
            lessons: [],
            actions: [],
            mistakes: [],
            checklist: [],
            practice: "",
            reflection: "",
            summary: "",
            sources: [],
            translations: {},
            createdAt: now,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );
};
const localizedPayload = (body) => ({
  title: clean(body.title, 180),
  subtitle: clean(body.subtitle, 300),
  quran:
    body.quran && typeof body.quran === "object"
      ? {
          surah: clean(body.quran.surah, 100),
          reference: clean(body.quran.reference, 50),
          arabic: clean(body.quran.arabic, 1200),
          meaning: clean(body.quran.meaning, 1600),
          lesson: clean(body.quran.lesson, 2400),
          url: clean(body.quran.url, 500),
        }
      : null,
  introduction: list(body.introduction, 12, 50000),
  lessons: list(body.lessons, 20),
  actions: list(body.actions, 20),
  mistakes: list(body.mistakes, 20),
  checklist: list(body.checklist, 20),
  practice: clean(body.practice, 2400),
  reflection: clean(body.reflection, 1200),
  summary: clean(body.summary, 1600),
  sources: Array.isArray(body.sources)
    ? body.sources
        .slice(0, 20)
        .map((x) => ({
          label: clean(x?.label, 160),
          note: clean(x?.note, 800),
          url: clean(x?.url, 500),
        }))
        .filter((x) => x.label && x.url)
    : [],
});
const publicItem = (item, language = "en", adminView = false) => {
  const code = languageCode(language),
    translation = code === "en" ? null : item.translations?.[code],
    localized = translation || item;
  return {
    id: item._id.toString(),
    slug: item.slug,
    kind: item.kind || "chapter",
    section: item.section || "General Muslim Life",
    parentCategorySlug: item.parentCategorySlug || "",
    category: item.category,
    title: localized.title || item.title,
    subtitle: localized.subtitle || item.subtitle,
    icon: item.icon,
    order: item.order,
    published: item.published,
    quran: localized.quran || item.quran || null,
    introduction: localized.introduction?.length
      ? localized.introduction
      : item.introduction || [],
    lessons: localized.lessons?.length ? localized.lessons : item.lessons || [],
    actions: localized.actions?.length ? localized.actions : item.actions || [],
    mistakes: localized.mistakes?.length
      ? localized.mistakes
      : item.mistakes || [],
    checklist: localized.checklist?.length
      ? localized.checklist
      : item.checklist || [],
    practice: localized.practice || item.practice || "",
    reflection: localized.reflection || item.reflection || "",
    summary: localized.summary || item.summary || "",
    sources: localized.sources?.length ? localized.sources : item.sources || [],
    language: translation ? code : "en",
    requestedLanguage: code,
    hasTranslation: Boolean(translation),
    availableLanguages: ["en", ...Object.keys(item.translations || {})],
    ...(adminView ? { translations: item.translations || {} } : {}),
  };
};

function createLifestyleRouter(getCollection, adminKey, jwtSecret) {
  const r = express.Router();
  const admin = (req, res, next) => {
    if (adminKey && req.get("x-admin-key") === adminKey) return next();
    try {
      const token = clean(req.get("authorization"), 400).replace(
          /^Bearer\s+/i,
          "",
        ),
        payload = jwt.verify(token, jwtSecret);
      if (payload.role !== "admin") throw Error("role");
      next();
    } catch {
      return res
        .status(401)
        .json({ message: "Admin session is invalid or expired." });
    }
  };
  const payload = (body) => ({
    kind: body.kind === "category" ? "category" : "chapter",
    section: clean(body.section, 80) || "General Muslim Life",
    parentCategorySlug: slugify(body.parentCategorySlug),
    category: clean(body.category, 80) || "General Muslim Life",
    title: clean(body.title, 180),
    subtitle: clean(body.subtitle, 300),
    icon: clean(body.icon, 20) || "\u25C6",
    order: Math.max(1, Math.min(999, Number(body.order) || 1)),
    published: body.published !== false,
    quran:
      body.quran && typeof body.quran === "object"
        ? {
            surah: clean(body.quran.surah, 100),
            reference: clean(body.quran.reference, 50),
            arabic: clean(body.quran.arabic, 1200),
            meaning: clean(body.quran.meaning, 1600),
            lesson: clean(body.quran.lesson, 2400),
            url: clean(body.quran.url, 500),
          }
        : null,
    introduction: list(body.introduction, 12, 50000),
    lessons: list(body.lessons, 20),
    actions: list(body.actions, 20),
    mistakes: list(body.mistakes, 20),
    checklist: list(body.checklist, 20),
    practice: clean(body.practice, 2400),
    reflection: clean(body.reflection, 1200),
    summary: clean(body.summary, 1600),
    sources: Array.isArray(body.sources)
      ? body.sources
          .slice(0, 20)
          .map((x) => ({
            label: clean(x?.label, 160),
            note: clean(x?.note, 800),
            url: clean(x?.url, 500),
          }))
          .filter((x) => x.label && x.url)
      : [],
  });
  r.get("/api/islamic-lifestyle", async (req, res) => {
    try {
      const language = languageCode(req.query.language),
        collection = getCollection();
      await ensureSharedCategories(collection);
      const items = await collection
        .find({ published: true })
        .sort({ section: 1, parentCategorySlug: 1, order: 1, title: 1 })
        .toArray();
      res.set("Cache-Control", "no-store, max-age=0");
      res.json({ data: items.map((item) => publicItem(item, language)) });
    } catch (e) {
      res
        .status(500)
        .json({ message: "Unable to load Islamic Lifestyle content." });
    }
  });
  r.get("/api/admin/islamic-lifestyle", admin, async (_req, res) => {
    const items = await getCollection()
      .find({})
      .sort({ section: 1, parentCategorySlug: 1, order: 1, title: 1 })
      .toArray();
    res.json({ data: items.map(publicItem) });
  });
  r.post("/api/admin/islamic-lifestyle", admin, async (req, res) => {
    try {
      const item = payload(req.body);
      if (item.title.length < 3)
        return res.status(400).json({ message: "Card title is required." });
      let slug = slugify(req.body.slug || item.title) || "chapter";
      if (await getCollection().findOne({ slug })) slug += "-" + Date.now();
      const now = new Date(),
        doc = { ...item, slug, createdAt: now, updatedAt: now },
        result = await getCollection().insertOne(doc);
      res
        .status(201)
        .json({ data: publicItem({ ...doc, _id: result.insertedId }) });
    } catch (e) {
      res.status(500).json({ message: "Unable to create chapter." });
    }
  });
  r.put("/api/admin/islamic-lifestyle/:id", admin, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid chapter ID." });
      const language = languageCode(req.body.language),
        item = payload(req.body),
        updates =
          language === "en"
            ? { ...item, updatedAt: new Date() }
            : {
                ["translations." + language]: localizedPayload(req.body),
                updatedAt: new Date(),
              },
        result = await getCollection().findOneAndUpdate(
          { _id: new ObjectId(req.params.id) },
          { $set: updates },
          { returnDocument: "after" },
        );
      if (!result)
        return res.status(404).json({ message: "Chapter not found." });
      res.json({ data: publicItem(result, "en", true) });
    } catch (e) {
      res.status(500).json({ message: "Unable to update chapter." });
    }
  });
  r.delete("/api/admin/islamic-lifestyle/:id", admin, async (req, res) => {
    if (!ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid chapter ID." });
    const collection = getCollection(),
      existing = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!existing)
      return res.status(404).json({ message: "Content not found." });
    if (
      existing.kind === "category" &&
      (await collection.countDocuments({
        kind: "chapter",
        parentCategorySlug: existing.slug,
      }))
    )
      return res
        .status(409)
        .json({ message: "Delete the chapters inside this category first." });
    await collection.deleteOne({ _id: existing._id });
    res.json({
      message:
        existing.kind === "category" ? "Category deleted." : "Chapter deleted.",
    });
  });
  r.get("/admin/islamic-lifestyle", (_req, res) =>
    res.type("html").send(adminHtml()),
  );
  return r;
}

function adminHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Islamic Lifestyle Manager</title><style>body{margin:0;font:14px Arial;background:#f3f8f4;color:#173d2e}header{padding:22px;background:#075b3b;color:#fff}main{max-width:1200px;margin:auto;padding:20px}.card{background:#fff;border:1px solid #dce8df;border-radius:18px;padding:18px;margin-bottom:16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.wide{grid-column:1/-1}label{font-weight:700}input,textarea,select{box-sizing:border-box;width:100%;padding:10px;margin-top:5px;border:1px solid #ceddd2;border-radius:9px}textarea{min-height:82px}button{border:0;border-radius:9px;padding:11px 16px;background:#087a4d;color:#fff;font-weight:700;cursor:pointer}.danger{background:#ad4232}.row{display:flex;gap:9px;align-items:center}.item{display:flex;justify-content:space-between;padding:13px;border-top:1px solid #e7eee9}.item small{display:block;color:#718078;margin-top:4px}@media(max-width:700px){.grid{grid-template-columns:1fr}.wide{grid-column:auto}}</style></head><body><header><h2>Islamic Lifestyle â€¢ Category & Chapter Manager</h2><p>Create the cards shown in the mobile app.</p></header><main><div class="card"><label>Admin API Key<input id="key" type="password"></label><button onclick="load()">Connect</button><span id="status"></span></div><form class="card" onsubmit="save(event)"><input id="id" type="hidden"><div class="grid"><label>Content type<select id="kind"><option value="category">Category card</option><option value="chapter">Chapter inside category</option></select></label><label>Section<input id="section" required value="General Muslim Life"></label><label>Parent category slug<input id="parentCategorySlug" placeholder="Required for chapters only"></label><label>Display order<input id="order" type="number" min="1" value="1"></label><label>Card title<input id="title" required></label><label>Icon / emoji<input id="icon" value="â—†"></label><label class="wide">Card subtitle<input id="subtitle"></label><label>Quran reference<input id="reference" placeholder="Quran 51:56"></label><label>Surah<input id="surah" placeholder="Adh-Dhariyat"></label><label class="wide">Arabic ayah<textarea id="arabic"></textarea></label><label class="wide">Meaning<textarea id="meaning"></textarea></label><label class="wide">Islamic lesson<textarea id="lesson"></textarea></label><label class="wide">Detailed paragraphs (one per line)<textarea id="introduction"></textarea></label><label class="wide">Key lessons (one per line)<textarea id="lessons"></textarea></label><label class="wide">Action plan (one per line)<textarea id="actions"></textarea></label><label class="wide">Mistakes to avoid (one per line)<textarea id="mistakes"></textarea></label><label class="wide">Checklist (one per line)<textarea id="checklist"></textarea></label><label>Practice<textarea id="practice"></textarea></label><label>Reflection<textarea id="reflection"></textarea></label><label class="wide">Summary<textarea id="summary"></textarea></label><label class="wide">Sources: Label | Note | URL (one per line)<textarea id="sources"></textarea></label><label class="row"><input id="published" type="checkbox" checked style="width:auto">Published in app</label></div><p class="row"><button>Save chapter</button><button type="button" onclick="resetForm()">New</button></p></form><section class="card"><h3>Category-wise cards</h3><div id="list">Connect to load content.</div></section></main><script>let items=[];const e=id=>document.getElementById(id),headers=()=>({'Content-Type':'application/json','x-admin-key':e('key').value}),lines=id=>e(id).value.split('\n').map(x=>x.trim()).filter(Boolean);async function load(){const r=await fetch('/api/admin/islamic-lifestyle',{headers:headers()}),j=await r.json();if(!r.ok)return e('status').textContent=j.message;items=j.data;e('status').textContent=' Connected';render()}function render(){let last='';e('list').innerHTML=items.map((x,i)=>{const h=x.section!==last?'<h3>'+esc(last=x.section)+'</h3>':'';return h+'<div class="item"><div><b>'+esc(x.title)+'</b><small>#'+x.order+' â€¢ '+(x.published?'Published':'Draft')+' â€¢ '+esc(x.quran?.reference||'No Quran source')+'</small></div><div class="row"><button onclick="edit('+i+')">Edit</button><button class="danger" onclick="removeItem('+i+')">Delete</button></div></div>'}).join('')||'No cards yet.'}function esc(x){return String(x||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}function edit(i){const x=items[i];['id','kind','section','parentCategorySlug','order','title','icon','subtitle','practice','reflection','summary'].forEach(k=>e(k).value=x[k]??'');['surah','reference','arabic','meaning','lesson'].forEach(k=>e(k).value=x.quran?.[k]??'');['introduction','lessons','actions','mistakes','checklist'].forEach(k=>e(k).value=(x[k]||[]).join('\n'));e('sources').value=(x.sources||[]).map(s=>[s.label,s.note,s.url].join(' | ')).join('\n');e('published').checked=x.published;scrollTo(0,150)}function resetForm(){document.querySelector('form').reset();e('id').value='';e('order').value='1';e('published').checked=true}async function save(ev){ev.preventDefault();const id=e('id').value,body={kind:e('kind').value,section:e('section').value,parentCategorySlug:e('parentCategorySlug').value,category:e('section').value,order:+e('order').value,title:e('title').value,icon:e('icon').value,subtitle:e('subtitle').value,published:e('published').checked,quran:{surah:e('surah').value,reference:e('reference').value,arabic:e('arabic').value,meaning:e('meaning').value,lesson:e('lesson').value,url:e('reference').value.replace('Quran ','https://quran.com/').replace(':','/')},introduction:lines('introduction'),lessons:lines('lessons'),actions:lines('actions'),mistakes:lines('mistakes'),checklist:lines('checklist'),practice:e('practice').value,reflection:e('reflection').value,summary:e('summary').value,sources:lines('sources').map(x=>{const [label,note,url]=x.split('|').map(y=>y.trim());return{label,note,url}})};const r=await fetch(id?'/api/admin/islamic-lifestyle/'+id:'/api/admin/islamic-lifestyle',{method:id?'PUT':'POST',headers:headers(),body:JSON.stringify(body)}),j=await r.json();if(!r.ok)return alert(j.message);resetForm();load()}async function removeItem(i){if(!confirm('Delete '+items[i].title+'?'))return;const r=await fetch('/api/admin/islamic-lifestyle/'+items[i].id,{method:'DELETE',headers:headers()});if(!r.ok)return alert('Delete failed');load()}</script></body></html>`;
}

module.exports = { createLifestyleRouter };
