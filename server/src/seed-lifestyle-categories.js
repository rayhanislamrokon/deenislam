require("dotenv").config();
const { MongoClient } = require("mongodb");

const categories = [
  [
    "General Muslim Life",
    "muslim-life",
    "🌿",
    "How a Muslim Should Live",
    "Faith, character and a balanced life",
  ],
  [
    "General Muslim Life",
    "men",
    "👦",
    "Life Guidance for Men",
    "Faithful and responsible manhood",
  ],
  [
    "General Muslim Life",
    "women",
    "👩",
    "Life Guidance for Women",
    "Faith, dignity and meaningful growth",
  ],
  [
    "General Muslim Life",
    "husband",
    "🤵",
    "Husband After Marriage",
    "Mercy, provision and partnership",
  ],
  [
    "General Muslim Life",
    "wife",
    "👰",
    "Wife After Marriage",
    "Respect, partnership and family peace",
  ],
  [
    "General Muslim Life",
    "father",
    "👨‍👧",
    "Fatherhood & Parenting",
    "Protection, teaching and presence",
  ],
  [
    "General Muslim Life",
    "mother",
    "👩‍👧",
    "Motherhood & Parenting",
    "Nurture, guidance and wellbeing",
  ],
  [
    "General Muslim Life",
    "children",
    "🧒",
    "What Children Should Learn",
    "Faith, manners, safety and life skills",
  ],
  [
    "Islamic Educator Life",
    "male-scholar",
    "🕌",
    "Male Islamic Scholars",
    "Knowledge with humility and service",
  ],
  [
    "Islamic Educator Life",
    "female-scholar",
    "📗",
    "Female Islamic Scholars",
    "Knowledge, dignity and community benefit",
  ],
  [
    "Islamic Educator Life",
    "male-teacher",
    "👨‍🏫",
    "Teaching Life for Men",
    "Sincerity, preparation and responsibility",
  ],
  [
    "Islamic Educator Life",
    "female-teacher",
    "👩‍🏫",
    "Teaching Life for Women",
    "Wisdom, preparation and responsibility",
  ],
  [
    "Islamic Educator Life",
    "male-mixed-teaching",
    "🧑‍🤝‍🧑",
    "Male Teacher: Boys & Girls",
    "Safe conduct and clear boundaries",
  ],
  [
    "Islamic Educator Life",
    "female-mixed-teaching",
    "🤝",
    "Female Teacher: Boys & Girls",
    "Safe conduct and clear boundaries",
  ],
];

async function run() {
  if (!process.env.MONGODB_URI) throw Error("MONGODB_URI is missing.");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const collection = client
      .db(process.env.MONGODB_DB || "deenislam")
      .collection("islamic_lifestyle");
    for (const [section, slug, icon, title, subtitle] of categories) {
      const order =
        categories
          .filter((x) => x[0] === section)
          .findIndex((x) => x[1] === slug) + 1;
      await collection.updateOne(
        { slug },
        {
          $set: {
            kind: "category",
            section,
            parentCategorySlug: "",
            category: section,
            slug,
            icon,
            title,
            subtitle,
            order,
            published: true,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
            introduction: [],
            lessons: [],
            actions: [],
            mistakes: [],
            checklist: [],
            sources: [],
            practice: "",
            reflection: "",
            summary: "",
            quran: null,
          },
        },
        { upsert: true },
      );
    }
    console.log(`Seeded ${categories.length} Islamic Lifestyle categories.`);
  } finally {
    await client.close();
  }
}
run().catch((error) => {
  console.error(error);
  process.exit(1);
});
