import { HOME_LANGUAGES } from "../data/homeLanguages";

const COUNTRY_LANGUAGE_GROUPS: Record<string, string> = {
  bn: "BD",
  ar: "SA,AE,QA,KW,BH,OM,YE,EG,JO,LB,SY,IQ,PS,LY,SD,DZ,TN,MA,MR,SO,DJ,KM",
  ur: "PK",
  fa: "IR",
  ps: "AF",
  tr: "TR,CY",
  id: "ID",
  ms: "MY,BN",
  hi: "IN",
  en: "US,GB,CA,AU,NZ,IE,SG,ZA,NG,GH,KE,UG,TZ,ZM,ZW,BW,NA,LR,SL,GM,MW,LS,SZ,JM,TT,BS,BB,BZ,GY,FJ,PG,MT",
  fr: "FR,BE,LU,MC,SN,CI,ML,NE,BF,BJ,TG,GN,GA,CG,CD,CM,TD,CF,MG,HT,RW,BI",
  es: "ES,MX,AR,CL,CO,PE,VE,EC,BO,PY,UY,CR,PA,GT,HN,SV,NI,DO,CU,GQ",
  pt: "PT,BR,AO,MZ,GW,CV,ST,TL",
  ru: "RU,BY,KZ,KG",
  uk: "UA",
  de: "DE,AT,LI,CH",
  it: "IT,SM,VA",
  nl: "NL,SR",
  sv: "SE",
  no: "NO",
  da: "DK",
  fi: "FI",
  pl: "PL",
  cs: "CZ",
  ro: "RO,MD",
  hu: "HU",
  bg: "BG",
  el: "GR",
  sq: "AL,XK",
  bs: "BA",
  hr: "HR",
  sr: "RS,ME",
  mk: "MK",
  sl: "SI",
  sk: "SK",
  et: "EE",
  lv: "LV",
  lt: "LT",
  is: "IS",
  ga: "IE",
  zh: "CN,TW,HK,MO",
  ja: "JP",
  ko: "KR,KP",
  vi: "VN",
  th: "TH",
  km: "KH",
  lo: "LA",
  my: "MM",
  ne: "NP",
  si: "LK",
  dv: "MV",
  uz: "UZ",
  tk: "TM",
  tg: "TJ",
  az: "AZ",
  hy: "AM",
  ka: "GE",
  he: "IL",
  sw: "KE,TZ",
  am: "ET",
};

const COUNTRY_TO_LANGUAGE = Object.fromEntries(
  Object.entries(COUNTRY_LANGUAGE_GROUPS).flatMap(([language, countries]) =>
    countries.split(",").map((country) => [country, language]),
  ),
) as Record<string, string>;

const supported = new Set(HOME_LANGUAGES.map((item) => item.code));
const normalizeLanguage = (value = "") => value.toLowerCase().split(/[-_]/)[0];

export type DetectedLocale = { country: string; language: string };

export async function detectWebLocale(): Promise<DetectedLocale> {
  const browserLanguage = normalizeLanguage(navigator.languages?.[0] || navigator.language || "en");
  const browserRegion = (navigator.language.match(/[-_]([A-Za-z]{2})$/)?.[1] || "").toUpperCase();
  let country = browserRegion;
  try {
    const response = await fetch("https://api.country.is/", {
      signal: AbortSignal.timeout(3500),
      cache: "no-store",
    });
    const body = await response.json();
    const detected = String(body?.country || "").toUpperCase();
    if (/^[A-Z]{2}$/.test(detected)) country = detected;
  } catch {}
  const countryLanguage = COUNTRY_TO_LANGUAGE[country];
  const language = supported.has(countryLanguage)
    ? countryLanguage
    : supported.has(browserLanguage)
      ? browserLanguage
      : "en";
  return { country, language };
}
