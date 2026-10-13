require("dotenv").config();
const jwt = require("jsonwebtoken");
(async () => {
  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "2m",
    }),
    r = await fetch("http://localhost:4000/api/admin/hadith/existing/b", {
      headers: { authorization: "Bearer " + token },
    }),
    j = await r.json(),
    rows = j.data || [],
    numbers = rows.map((x) => Number(x.hadithNumber)).filter(Number.isFinite);
  console.log(
    JSON.stringify({
      records: rows.length,
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      has7589: rows.some((x) => String(x.hadithNumber) === "7589"),
      lastFive: rows.slice(-5).map((x) => x.hadithNumber),
    }),
  );
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
