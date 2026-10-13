require("dotenv").config();
const jwt = require("jsonwebtoken");
(async () => {
  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1m",
    }),
    response = await fetch("http://localhost:4000/api/admin/quran/surahs", {
      headers: { Authorization: "Bearer " + token },
    }),
    body = await response.json();
  if (!response.ok) throw Error(body.message);
  const first = body.data.find((x) => x.number === 1);
  console.log(
    JSON.stringify(
      {
        number: first?.number,
        translationProgress: first?.translationProgress,
      },
      null,
      2,
    ),
  );
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
