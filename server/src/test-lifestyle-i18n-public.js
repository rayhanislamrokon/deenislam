require("dotenv").config();
const base = "http://localhost:4000",
  headers = {
    "Content-Type": "application/json",
    "x-admin-key": process.env.ADMIN_API_KEY,
  };
const request = async (path, options = {}) => {
  const response = await fetch(base + path, { ...options, headers }),
    body = await response.json();
  if (!response.ok) throw Error(body.message || `HTTP ${response.status}`);
  return body;
};
(async () => {
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
        published: true,
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
    const admin = (await request("/api/admin/islamic-lifestyle")).data.find(
      (item) => item.id === id,
    );
    if (admin?.translations?.bn?.title !== "ভাষা যাচাই")
      throw Error("Admin translation retrieval failed.");
    const translated = (
      await request("/api/islamic-lifestyle?language=bn")
    ).data.find((item) => item.id === id);
    if (
      translated?.title !== "ভাষা যাচাই" ||
      translated?.language !== "bn" ||
      !translated?.hasTranslation
    )
      throw Error("Public localization failed.");
    const fallback = (
      await request("/api/islamic-lifestyle?language=fr")
    ).data.find((item) => item.id === id);
    if (
      fallback?.title !== "Language verification" ||
      fallback?.language !== "en" ||
      fallback?.hasTranslation
    )
      throw Error("English fallback failed.");
    console.log(
      "Multilingual Lifestyle verified: Bengali localization and English fallback work.",
    );
  } finally {
    if (id)
      await request("/api/admin/islamic-lifestyle/" + id, {
        method: "DELETE",
      }).catch(() => {});
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
