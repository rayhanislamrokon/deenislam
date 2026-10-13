export type WebTranslationTable = Record<string, string>;

export async function loadWebTranslationPack(
  api: string,
  language: string,
): Promise<WebTranslationTable> {
  if (language === "en") return {};
  try {
    const response = await fetch(
      `${api}/api/translations/${encodeURIComponent(language)}?refresh=${Date.now()}`,
      { cache: "no-store" },
    );
    const body = await response.json();
    if (
      response.ok &&
      body.data?.strings &&
      typeof body.data.strings === "object"
    )
      return body.data.strings;
  } catch {}
  return {};
}
