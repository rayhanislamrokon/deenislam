require("dotenv").config();
const jwt = require("jsonwebtoken");
const base = "http://localhost:4000";
const token = jwt.sign(
  {
    role: "admin",
    email: process.env.ADMIN_EMAIL || "admin@local.test",
    adminId: "verification",
  },
  process.env.JWT_SECRET,
  { expiresIn: "2m" },
);
const headers = {
  "Content-Type": "application/json",
  Authorization: "Bearer " + token,
};
async function request(path, options = {}) {
  const response = await fetch(base + path, { ...options, headers }),
    body = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(response.status + " " + (body.message || path));
  return body;
}
async function run() {
  let id = "";
  try {
    const data = {
      kind: "chapter",
      section: "General Muslim Life",
      parentCategorySlug: "muslim-life",
      order: 999,
      title: "CRUD verification chapter",
      subtitle: "Temporary verification",
      published: false,
      quran: {
        surah: "Al-Fatihah",
        reference: "Quran 1:1",
        arabic: "بِسْمِ اللَّهِ",
        meaning: "Test meaning",
        lesson: "Test lesson",
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
    };
    const created = await request("/api/admin/islamic-lifestyle", {
      method: "POST",
      body: JSON.stringify(data),
    });
    id = created.data.id;
    await request("/api/admin/islamic-lifestyle/" + id, {
      method: "PUT",
      body: JSON.stringify({ ...data, title: "CRUD verification updated" }),
    });
    const all = await request("/api/admin/islamic-lifestyle"),
      found = all.data.find((x) => x.id === id);
    if (
      !found ||
      found.title !== "CRUD verification updated" ||
      found.quran?.reference !== "Quran 1:1" ||
      found.introduction?.[0] !== "Paragraph saved" ||
      found.sources?.[0]?.url !== "https://quran.com/1/1"
    )
      throw Error("Form fields did not round-trip.");
    console.log(
      "Lifestyle form verified: create, load, edit and every circled content field passed.",
    );
  } finally {
    if (id)
      await request("/api/admin/islamic-lifestyle/" + id, {
        method: "DELETE",
      }).catch(() => {});
  }
}
run().catch((error) => {
  console.error(error);
  process.exit(1);
});
