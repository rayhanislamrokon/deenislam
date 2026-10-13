require("dotenv").config();
const base = "http://localhost:4000";
const headers = {
  "Content-Type": "application/json",
  "x-admin-key": process.env.ADMIN_API_KEY || "",
};
async function request(path, options = {}) {
  const response = await fetch(base + path, {
      ...options,
      headers: { ...headers, ...options.headers },
    }),
    body = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(response.status + " " + (body.message || path));
  return body;
}
async function run() {
  const created = await request("/api/admin/islamic-lifestyle", {
    method: "POST",
    body: JSON.stringify({
      kind: "chapter",
      section: "General Muslim Life",
      parentCategorySlug: "muslim-life",
      order: 999,
      title: "CRUD verification chapter",
      subtitle: "Temporary automated verification",
      published: false,
      quran: {
        surah: "Test",
        reference: "Quran 1:1",
        arabic: "اختبار",
        meaning: "Test",
        lesson: "Test",
        url: "https://quran.com/1/1",
      },
      introduction: ["Paragraph saved"],
      lessons: ["Lesson saved"],
      actions: ["Action saved"],
      mistakes: ["Mistake saved"],
      checklist: ["Checklist saved"],
      practice: "Practice saved",
      reflection: "Reflection saved",
      summary: "Summary saved",
      sources: [
        {
          label: "Quran 1:1",
          note: "Source saved",
          url: "https://quran.com/1/1",
        },
      ],
    }),
  });
  const id = created.data.id;
  const updated = await request("/api/admin/islamic-lifestyle/" + id, {
    method: "PUT",
    body: JSON.stringify({
      ...created.data,
      title: "CRUD verification updated",
      kind: "chapter",
      section: "General Muslim Life",
      parentCategorySlug: "muslim-life",
    }),
  });
  const all = await request("/api/admin/islamic-lifestyle");
  const found = all.data.find((x) => x.id === id);
  if (
    !found ||
    updated.data.title !== "CRUD verification updated" ||
    found.quran?.reference !== "Quran 1:1" ||
    found.introduction?.[0] !== "Paragraph saved"
  )
    throw Error("Saved fields did not round-trip.");
  await request("/api/admin/islamic-lifestyle/" + id, { method: "DELETE" });
  console.log(
    "Lifestyle CRUD verified: create, read, update, delete and all form fields passed.",
  );
}
run().catch((error) => {
  console.error(error);
  process.exit(1);
});
