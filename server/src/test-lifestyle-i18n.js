require("dotenv").config();
const base = "http://localhost:4000";
const headers = {
  "Content-Type": "application/json",
  "x-admin-key": process.env.ADMIN_API_KEY,
};
const request = async (path, options = {}) => {
  const response = await fetch(base + path, {
      ...options,
      headers: { ...headers, ...options.headers },
    }),
    body = await response.json();
  if (!response.ok) throw Error(body.message || `HTTP ${response.status}`);
  return body;
};
async function main() {
  let id = "";
  try {
    const created = await request("/api/admin/islamic-lifestyle", {
      method: "POST",
      body: JSON.stringify({
        kind: "chapter",
        section: "General Muslim Life",
        parentCategorySlug: "muslim-life",
        order: 999,
        title: "Language verification",
        subtitle: "English base",
        icon: "T",
        published: false,
        introduction: ["<p>English content</p>"],
      }),
    });
    id = created.data.id;
    await request("/api/admin/islamic-lifestyle/" + id, {
      method: "PUT",
      body: JSON.stringify({
        language: "bn",
        title: "ভাষা যাচাই",
        subtitle: "বাংলা কনটেন্ট",
        introduction: ["<p>বাংলা লেখা</p>"],
      }),
    });
    const admin = await request("/api/admin/islamic-lifestyle"),
      saved = admin.data.find((item) => item.id === id);
    if (saved?.translations?.bn?.title !== "ভাষা যাচাই")
      throw Error("Admin translation was not persisted.");
    const collection = await request("/api/islamic-lifestyle?language=bn");
    const translated = collection.data.find((item) => item.id === id);
    if (translated)
      throw Error("Draft item unexpectedly appeared in public API.");
    console.log(
      "Lifestyle multilingual CRUD verified: English base + Bengali translation + admin retrieval + draft visibility.",
    );
  } finally {
    if (id)
      await request("/api/admin/islamic-lifestyle/" + id, {
        method: "DELETE",
      }).catch(() => {});
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
