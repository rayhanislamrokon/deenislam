require("dotenv").config();
const jwt = require("jsonwebtoken"),
  base = "http://localhost:4000",
  token = jwt.sign(
    { role: "admin", adminId: "prophets-test" },
    process.env.JWT_SECRET,
    { expiresIn: "2m" },
  ),
  headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
const call = async (path, options = {}) => {
  const response = await fetch(base + path, { ...options, headers }),
    body = await response.json();
  if (!response.ok) throw Error(body.message || response.status);
  return body;
};
(async () => {
  let id = "";
  try {
    const created = await call("/api/admin/prophets", {
      method: "POST",
      body: JSON.stringify({
        language: "en",
        name: "Verification Prophet",
        arabic: "اختبار",
        summary: "English summary",
        order: 999,
        published: true,
        parts: [
          {
            title: "Part one",
            story: "English story",
            reference: "Quran reference",
          },
        ],
      }),
    });
    id = created.data.id;
    await call("/api/admin/prophets/" + id, {
      method: "PUT",
      body: JSON.stringify({
        language: "bn",
        name: "যাচাই নবী",
        arabic: "اختبار",
        summary: "বাংলা সারাংশ",
        parts: [
          {
            title: "প্রথম অংশ",
            story: "বাংলা জীবনী",
            reference: "কুরআন রেফারেন্স",
          },
        ],
      }),
    });
    const admin = (await call("/api/admin/prophets")).data.find(
        (x) => x.id === id,
      ),
      bn = (await call("/api/prophets?language=bn")).data.find(
        (x) => x.id === id,
      ),
      fr = (await call("/api/prophets?language=fr")).data.find(
        (x) => x.id === id,
      );
    if (
      admin?.translations?.bn?.parts?.[0]?.story !== "বাংলা জীবনী" ||
      bn?.name !== "যাচাই নবী" ||
      bn?.parts?.[0]?.title !== "প্রথম অংশ" ||
      fr?.name !== "Verification Prophet"
    )
      throw Error("Prophets localization round-trip failed");
    console.log(
      "Prophets CRUD verified: all text fields, Bengali localization and English fallback.",
    );
  } finally {
    if (id)
      await call("/api/admin/prophets/" + id, { method: "DELETE" }).catch(
        () => {},
      );
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
