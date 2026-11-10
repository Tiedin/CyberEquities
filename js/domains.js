/** Afternic valuations × 5 for public showcase */
export const domains = [
  { name: "myac.com", tld: "com", value: 2030215 },
  { name: "jinn.com", tld: "com", value: 1116005 },
  { name: "1934.com", tld: "com", value: 834245 },
  { name: "greenfields.com", tld: "com", value: 758450 },
  { name: "smarthome.net", tld: "net", value: 667370 },
  { name: "gamefan.com", tld: "com", value: 626920 },
  { name: "buybuybuy.com", tld: "com", value: 536920 },
  { name: "printit.com", tld: "com", value: 528360 },
  { name: "businesslineofcredit.com", tld: "com", value: 512310 },
  { name: "golfer.org", tld: "org", value: 510145 },
  { name: "motorcross.com", tld: "com", value: 442410 },
  { name: "hustle.co", tld: "co", value: 394940 },
  { name: "defilab.com", tld: "com", value: 383635 },
  { name: "fastcapital.com", tld: "com", value: 327340 },
  { name: "313.co", tld: "co", value: 316755 },
  { name: "dancehub.com", tld: "com", value: 305595 },
  { name: "claw.co", tld: "co", value: 303295 },
  { name: "webwriter.com", tld: "com", value: 301500 },
  { name: "coinlogic.com", tld: "com", value: 294910 },
  { name: "deposit.org", tld: "org", value: 285070 },
  { name: "ncag.com", tld: "com", value: 277900 },
  { name: "labl.com", tld: "com", value: 266870 },
  { name: "ticket.org", tld: "org", value: 262070 },
  { name: "mezcla.com", tld: "com", value: 259915 },
  { name: "estudia.com", tld: "com", value: 257820 },
  { name: "velocitybank.com", tld: "com", value: 251330 },
  { name: "airbots.com", tld: "com", value: 247970 },
];

export function formatValue(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Capitalize the first letter of each word/segment for display */
export function displayName(name) {
  return String(name)
    .split(/([.\-_\s]+)/)
    .map((part) => {
      if (!part || /^[.\-_\s]+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

export function shortName(name) {
  return name.replace(/\.(com|net|org|co)$/i, "");
}
