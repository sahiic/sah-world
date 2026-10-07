import sharp from "sharp";
const files = [
  [
    "kaaba",
    "The Kabah in the Grand Mosque of Makkah from the second floor, Saudi Arabia (7) (52501682079).jpg",
  ],
  ["nabawi", "Al-Masjid al-Nabawi, Medina - panoramio.jpg"],
  ["aqsa", "Al-Aqsa Mosque, Jerusalem - Exterior - panoramio.jpg"],
  ["umayyad", "The Umayyad Mosque, Courtyard, Damascus, Syria.jpg"],
];
for (const [id, title] of files) {
  if (process.argv[2] && process.argv[2] !== id) continue;
  const endpoint = new URL("https://commons.wikimedia.org/w/api.php");
  endpoint.search = new URLSearchParams({
    action: "query",
    format: "json",
    titles: `File:${title}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
  });
  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "SAHWorld/1.0 (licensed focus background assets)",
    },
  });
  if (!response.ok) throw new Error(`Metadata: ${response.status}`);
  const json = await response.json();
  const info = Object.values(json.query.pages)[0].imageinfo[0];
  const asset = await fetch(info.url, {
    headers: { "User-Agent": "SAHWorld/1.0" },
  });
  if (!asset.ok) throw new Error(`Image: ${asset.status}`);
  await sharp(Buffer.from(await asset.arrayBuffer()))
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(`public/images/focus-${id}.webp`);
  console.log(
    JSON.stringify({
      id,
      url: info.url,
      author: info.extmetadata.Artist?.value,
      license: info.extmetadata.LicenseShortName?.value,
      licenseUrl: info.extmetadata.LicenseUrl?.value,
    }),
  );
}
