const express = require("express");
const { createBookCoverUpload } = require("./s3-books");
function text(v, max = 3000000) {
  return String(v ?? "")
    .trim()
    .slice(0, max);
}
function slugify(v) {
  return (
    text(v, 120)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || String(Date.now())
  );
}
function publicBook(x, withContent = false) {
  const out = {
    id: x._id.toString(),
    slug: x.slug,
    title: x.title,
    author: x.author,
    category: x.category,
    language: x.language,
    languageCode: x.languageCode || "",
    description: x.description,
    license: x.license,
    sourceUrl: x.sourceUrl,
    publicDomain: !!x.publicDomain,
    published: !!x.published,
    coverImageKey: x.coverImageKey || "",
    coverImageUrl: x.coverImageUrl || "",
    updatedAt: x.updatedAt,
  };
  if (withContent) {
    out.content = x.content;
    out.pages = Array.isArray(x.pages) ? x.pages : [];
    out.extraction = x.extraction || {};
  }
  return out;
}
function createBooksRouter(getBooks, adminKey) {
  const r = express.Router();
  const admin = (req, res, next) => {
    if (!adminKey)
      return res
        .status(503)
        .json({ message: "ADMIN_API_KEY is not configured." });
    if (req.get("x-admin-key") !== adminKey)
      return res.status(401).json({ message: "Invalid admin key." });
    next();
  };
  r.get("/api/books", async (req, res) => {
    try {
      const filter = { published: true };
      if (req.query.category) filter.category = text(req.query.category, 40);
      const language = text(req.query.language, 12).toLowerCase();
      if (language) filter.languageCode = language;
      const items = await getBooks()
        .find(filter, { projection: { content: 0, pages: 0 } })
        .sort({ updatedAt: -1 })
        .toArray();
      res.json({ data: items.map((x) => publicBook(x)) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Unable to load books." });
    }
  });
  r.get("/api/books/:slug", async (req, res) => {
    try {
      const item = await getBooks().findOne({
        slug: req.params.slug,
        published: true,
      });
      if (!item) return res.status(404).json({ message: "Book not found." });
      res.json({ data: publicBook(item, true) });
    } catch (e) {
      res.status(500).json({ message: "Unable to load this book." });
    }
  });
  r.post("/api/admin/books/cover-upload", admin, async (req, res) => {
    try {
      const data = await createBookCoverUpload({
        fileName: text(req.body.fileName, 180),
        contentType: text(req.body.contentType, 80),
      });
      res.json({ data });
    } catch (e) {
      res
        .status(400)
        .json({ message: e.message || "Unable to prepare image upload." });
    }
  });
  r.get("/api/admin/books", admin, async (_req, res) => {
    const items = await getBooks().find({}).sort({ updatedAt: -1 }).toArray();
    res.json({ data: items.map((x) => publicBook(x, true)) });
  });
  r.post("/api/admin/books", admin, async (req, res) => {
    try {
      const title = text(req.body.title, 180),
        content = text(req.body.content);
      if (title.length < 2 || content.length < 20)
        return res
          .status(400)
          .json({ message: "Title and book text are required." });
      let slug = slugify(req.body.slug || title);
      if (await getBooks().findOne({ slug })) slug += `-${Date.now()}`;
      const now = new Date(),
        item = {
          slug,
          title,
          author: text(req.body.author, 160),
          category: text(req.body.category, 40) || "Books",
          language: text(req.body.language, 40) || "English",
          description: text(req.body.description, 10000),
          license: text(req.body.license, 160) || "Public domain",
          sourceUrl: text(req.body.sourceUrl, 500),
          coverImageKey: text(req.body.coverImageKey, 500),
          coverImageUrl: text(req.body.coverImageUrl, 1000),
          publicDomain: req.body.publicDomain !== false,
          published: !!req.body.published,
          content,
          createdAt: now,
          updatedAt: now,
        };
      const result = await getBooks().insertOne(item);
      res
        .status(201)
        .json({ data: publicBook({ ...item, _id: result.insertedId }, true) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Unable to create book." });
    }
  });
  r.put("/api/admin/books/:slug", admin, async (req, res) => {
    try {
      const title = text(req.body.title, 180),
        content = text(req.body.content);
      if (title.length < 2 || content.length < 20)
        return res
          .status(400)
          .json({ message: "Title and book text are required." });
      const update = {
        title,
        author: text(req.body.author, 160),
        category: text(req.body.category, 40) || "Books",
        language: text(req.body.language, 40) || "English",
        description: text(req.body.description, 10000),
        license: text(req.body.license, 160) || "Public domain",
        sourceUrl: text(req.body.sourceUrl, 500),
        coverImageKey: text(req.body.coverImageKey, 500),
        coverImageUrl: text(req.body.coverImageUrl, 1000),
        publicDomain: req.body.publicDomain !== false,
        published: !!req.body.published,
        content,
        updatedAt: new Date(),
      };
      const result = await getBooks().findOneAndUpdate(
        { slug: req.params.slug },
        { $set: update },
        { returnDocument: "after" },
      );
      if (!result) return res.status(404).json({ message: "Book not found." });
      res.json({ data: publicBook(result, true) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Unable to update book." });
    }
  });
  r.get("/admin/books", (_req, res) => res.type("html").send(adminHtml()));
  return r;
}
function adminHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>DeenIslam Books Admin</title><style>body{font:14px Arial;margin:0;background:#f3faf5;color:#17392d}header{padding:20px;background:#087a45;color:white}main{max-width:1100px;margin:auto;padding:20px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.card{background:white;border:1px solid #d9e8dd;border-radius:14px;padding:18px}input,select,textarea{box-sizing:border-box;width:100%;margin:6px 0 12px;padding:11px;border:1px solid #ceddd2;border-radius:8px}textarea{min-height:360px;font-family:serif;line-height:1.6}button{border:0;border-radius:8px;padding:11px 16px;background:#087a45;color:white;cursor:pointer}.danger{background:#a52a2a}.book{padding:12px 0;border-bottom:1px solid #e4eee7}.row{display:flex;gap:8px;align-items:center}.row input{width:auto;margin:0}small{color:#66766d}@media(max-width:760px){.grid{grid-template-columns:1fr}}</style></head><body><header><h2>DeenIslam • Books Admin</h2></header><main><div class="card"><label>Admin API Key</label><div class="row"><input id="key" type="password" placeholder="ADMIN_API_KEY"><button onclick="load()">Connect</button></div><p id="status"></p></div><div class="grid"><form class="card" onsubmit="save(event)"><input id="slug" type="hidden"><label>Title</label><input id="title" required><label>Author / Translator</label><input id="author"><div class="row"><div><label>Category</label><select id="category"><option>Books</option><option>Tafsir</option><option>Hadith</option><option>Fiqh</option><option>Aqidah</option><option>History</option></select></div><div><label>Language</label><input id="language" value="English"></div></div><label>Description</label><textarea id="description" style="min-height:80px"></textarea><label>Copyright / License</label><input id="license" value="Public domain"><label>Original source URL</label><input id="sourceUrl"><label>Cover image (JPG, PNG or WebP to AWS S3)</label><input id="coverFile" type="file" accept="image/jpeg,image/png,image/webp"><input id="coverImageKey" type="hidden"><input id="coverImageUrl" type="hidden"><small id="coverStatus"></small><div class="row"><input id="publicDomain" type="checkbox" checked><label>Public domain verified</label><input id="published" type="checkbox"><label>Published</label></div><label>Full book text</label><textarea id="content" required placeholder="Paste the complete verified public-domain text here..."></textarea><div class="row"><button>Save Book</button><button type="button" onclick="resetForm()">New</button></div></form><section class="card"><h3>Books</h3><div id="list">Connect to load books.</div></section></div></main><script>let books=[];const el=id=>document.getElementById(id),headers=()=>({'Content-Type':'application/json','x-admin-key':el('key').value});async function load(){try{const r=await fetch('/api/admin/books',{headers:headers()}),j=await r.json();if(!r.ok)throw Error(j.message);books=j.data;el('status').textContent='Connected';render()}catch(e){el('status').textContent=e.message}}function render(){el('list').innerHTML=books.map((b,i)=>'<div class="book"><b>'+esc(b.title)+'</b><br><small>'+esc(b.author)+' • '+esc(b.category)+' • '+(b.published?'Published':'Draft')+'</small><p><button onclick="edit('+i+')">Edit</button></p></div>').join('')||'No books yet.'}function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}function edit(i){const b=books[i];['slug','title','author','category','language','description','license','sourceUrl','coverImageKey','coverImageUrl','content'].forEach(k=>el(k).value=b[k]||'');el('publicDomain').checked=b.publicDomain;el('published').checked=b.published;scrollTo(0,250)}function resetForm(){document.querySelector('form').reset();el('slug').value='';el('language').value='English';el('license').value='Public domain'}async function uploadCover(){const file=el('coverFile').files[0];if(!file)return;el('coverStatus').textContent='Uploading cover...';const r=await fetch('/api/admin/books/cover-upload',{method:'POST',headers:headers(),body:JSON.stringify({fileName:file.name,contentType:file.type})}),j=await r.json();if(!r.ok)throw Error(j.message);const put=await fetch(j.data.uploadUrl,{method:'PUT',headers:{'Content-Type':j.data.contentType},body:file});if(!put.ok)throw Error('AWS upload failed');el('coverImageKey').value=j.data.key;el('coverImageUrl').value=j.data.publicUrl;el('coverStatus').textContent='Cover uploaded to AWS S3'}async function save(e){e.preventDefault();try{await uploadCover()}catch(err){return alert(err.message)}const slug=el('slug').value,body={};['title','author','category','language','description','license','sourceUrl','coverImageKey','coverImageUrl','content'].forEach(k=>body[k]=el(k).value);body.publicDomain=el('publicDomain').checked;body.published=el('published').checked;const r=await fetch(slug?'/api/admin/books/'+slug:'/api/admin/books',{method:slug?'PUT':'POST',headers:headers(),body:JSON.stringify(body)}),j=await r.json();if(!r.ok)return alert(j.message);resetForm();load()}</script></body></html>`;
}
module.exports = { createBooksRouter };
