require("dotenv").config();
const jwt = require("jsonwebtoken");
(async () => {
  const token = jwt.sign(
      { role: "admin", sub: "local-verification" },
      process.env.JWT_SECRET,
      { expiresIn: "2m" },
    ),
    headers = { Authorization: "Bearer " + token };
  const list = await fetch("http://localhost:4000/api/admin/quran/surahs", {
      headers,
    }),
    listBody = await list.json();
  if (!list.ok) throw Error(listBody.message || "Admin Surah list failed");
  const first = await fetch("http://localhost:4000/api/admin/quran/surahs/1", {
      headers,
    }),
    firstBody = await first.json();
  if (!first.ok) throw Error(firstBody.message || "Admin Surah detail failed");
  const publicResponse = await fetch(
      "http://localhost:4000/api/quran/surahs/1?language=bn",
    ),
    publicBody = await publicResponse.json();
  if (!publicResponse.ok)
    throw Error(publicBody.message || "Public Quran failed");
  console.log(
    JSON.stringify(
      {
        surahs: listBody.data.length,
        firstSurah: firstBody.data.englishName,
        ayahs: firstBody.data.ayahs.length,
        publicLanguageReady: Boolean(publicBody.data?.ayahs?.length),
      },
      null,
      2,
    ),
  );
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
