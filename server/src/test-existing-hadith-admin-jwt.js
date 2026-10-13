require("dotenv").config();
const jwt = require("jsonwebtoken");
(async () => {
  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "2m",
    }),
    response = await fetch(
      "http://localhost:4000/api/admin/hadith/existing/b",
      { headers: { authorization: "Bearer " + token } },
    ),
    body = await response.json();
  if (!response.ok) throw Error(body.message || "HTTP " + response.status);
  console.log(
    JSON.stringify({
      collection: "b",
      count: body.data?.length || 0,
      firstNumber: body.data?.[0]?.hadithNumber,
      hasArabic: Boolean(body.data?.[0]?.arabic),
      hasEnglish: Boolean(body.data?.[0]?.text),
    }),
  );
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
