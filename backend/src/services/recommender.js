import { hashTextToIndex } from "../utils/hash.js";

const SHOPPING_AFFILIATES = {
  topWear: [
    { retailer: "Amazon", baseUrl: "https://amazon.com/s?k=", affiliateTag: "&tag=fitaura-20" },
    { retailer: "Zara", baseUrl: "https://www.zara.com/us/en/search?searchTerm=", affiliateTag: "" },
    { retailer: "H&M", baseUrl: "https://www2.hm.com/en_us/searchpage.html?q=", affiliateTag: "" }
  ],
  bottomWear: [
    { retailer: "Amazon", baseUrl: "https://amazon.com/s?k=", affiliateTag: "&tag=fitaura-20" },
    { retailer: "Levi's", baseUrl: "https://www.levi.com/US/en_US/search?q=", affiliateTag: "" },
    { retailer: "H&M", baseUrl: "https://www2.hm.com/en_us/searchpage.html?q=", affiliateTag: "" }
  ],
  footwear: [
    { retailer: "Amazon", baseUrl: "https://amazon.com/s?k=", affiliateTag: "&tag=fitaura-20" },
    { retailer: "Nike", baseUrl: "https://www.nike.com/w?q=", affiliateTag: "" },
    { retailer: "Adidas", baseUrl: "https://www.adidas.com/us/search?q=", affiliateTag: "" }
  ],
  accessories: [
    { retailer: "Amazon", baseUrl: "https://amazon.com/s?k=", affiliateTag: "&tag=fitaura-20" },
    { retailer: "Nordstrom", baseUrl: "https://www.nordstrom.com/sr?keyword=", affiliateTag: "" },
    { retailer: "Macy's", baseUrl: "https://www.macys.com/shop/search?keyword=", affiliateTag: "" }
  ]
};

const OCCASION_RULES = {
  College: {
    top: ["Relaxed fit tee + overshirt", "Solid polo + lightweight bomber", "Henley + denim jacket"],
    bottom: ["Straight-fit jeans", "Tapered chinos", "Cargo joggers"],
    footwear: ["White sneakers", "Retro runners", "Canvas low-tops"],
    accessories: ["Minimal watch + backpack", "Slim chain + tote bag", "Simple bracelet + cap"],
    hairstyle: ["Textured crop with low hold", "Natural side sweep", "Soft quiff"]
  },
  Interview: {
    top: ["Crisp oxford shirt + structured blazer", "Solid shirt + tailored jacket", "Fine knit polo + blazer"],
    bottom: ["Slim tailored trousers", "Dark straight chinos", "Wool blend formal pants"],
    footwear: ["Leather derbies", "Polished loafers", "Clean brogues"],
    accessories: ["Leather strap watch", "Simple belt matching shoes", "Document-friendly tote"],
    hairstyle: ["Neat side part", "Classic comb-back", "Clean short taper"]
  },
  Date: {
    top: ["Fitted knit shirt", "Open collar shirt + lightweight layer", "Soft-texture polo"],
    bottom: ["Dark slim jeans", "Pleated trousers", "Cropped chinos"],
    footwear: ["Chelsea boots", "Minimal leather sneakers", "Suede loafers"],
    accessories: ["Subtle fragrance + watch", "Slim chain + ring", "Textured belt + bracelet"],
    hairstyle: ["Volume front sweep", "Natural curls defined", "Soft matte finish"]
  },
  Party: {
    top: ["Statement shirt with neutral layer", "Satin touch bomber + tee", "Monochrome fitted shirt"],
    bottom: ["Black tapered jeans", "Relaxed formal trousers", "Slim fit cargos"],
    footwear: ["High-top sneakers", "Leather boots", "Chunky sneakers"],
    accessories: ["Layered chain + ring set", "Watch + subtle earrings", "Crossbody mini bag"],
    hairstyle: ["Messy textured style", "Faded sides + volume top", "Wet-look combback"]
  },
  Wedding: {
    top: ["Pastel kurta / bandh gala", "Tailored suit jacket + shirt", "Embroidery detail sherwani layer"],
    bottom: ["Matching churidar / trousers", "Tailored pleated trousers", "Structured formal pants"],
    footwear: ["Polished oxfords", "Ethnic mojaris", "Classic loafers"],
    accessories: ["Pocket square + watch", "Lapel pin + bracelet", "Statement cuff links"],
    hairstyle: ["Refined side part", "Classic slick back", "Defined textured top"]
  },
  "Casual Hangout": {
    top: ["Relaxed graphic tee", "Breathable shirt over basic tee", "Crewneck sweatshirt"],
    bottom: ["Washed jeans", "Jogger chinos", "Shorts (weather permitting)"],
    footwear: ["Everyday sneakers", "Slip-on shoes", "Skate-style shoes"],
    accessories: ["Cap + simple watch", "Bracelet stack", "Crossbody pouch"],
    hairstyle: ["Easy natural flow", "Light texture crop", "Low-maintenance fade"]
  },
  Travel: {
    top: ["Performance tee + overshirt", "Breathable hoodie", "Merino polo"],
    bottom: ["Stretch joggers", "Travel chinos", "Relaxed cargos"],
    footwear: ["Cushioned sneakers", "Comfort slip-ons", "Trail-inspired trainers"],
    accessories: ["Carry-on backpack", "Smartwatch", "Polarized shades"],
    hairstyle: ["Clean short style", "Tied-back long hair", "Low-maintenance textured cut"]
  }
};

const STYLE_ACCENT = {
  Minimal: {
    accessories: "Keep accessories clean and limited to one anchor piece.",
    confidence: "Confidence comes from fit precision. Prioritize clean lines and posture."
  },
  Streetwear: {
    accessories: "Add one expressive street element like a crossbody or statement cap.",
    confidence: "Carry the look with relaxed shoulders and confident movement."
  },
  Classy: {
    accessories: "Choose polished materials and match metal tones across accessories.",
    confidence: "Slow your pace and keep silhouettes sharp for a premium impression."
  },
  Ethnic: {
    accessories: "Use traditional textures in one focal item to avoid visual clutter.",
    confidence: "Own the look by pairing cultural details with well-fitted tailoring."
  },
  Sporty: {
    accessories: "Use functional accessories and breathable layers for comfort-first style.",
    confidence: "Athletic posture and clean grooming amplify sporty outfits."
  },
  Auto: {
    accessories: "Keep accessories balanced to support your outfit instead of competing with it.",
    confidence: "Choose one statement piece and let confident body language finish the look."
  }
};

function pick(items, seed) {
  const index = hashTextToIndex(seed, items.length);
  return items[index];
}

function toAgeBucket(age) {
  if (typeof age !== "number") {
    return "unknown";
  }
  if (age < 20) {
    return "teen";
  }
  if (age < 30) {
    return "20s";
  }
  if (age < 40) {
    return "30s";
  }
  if (age < 50) {
    return "40s";
  }
  return "50plus";
}

function buildDemographicStylingCue(demographicData) {
  const gender = demographicData?.gender ?? "unknown";
  const age = demographicData?.age ?? null;
  const ageBucket = toAgeBucket(age);

  const ageCue =
    ageBucket === "teen"
      ? "Keep fits flexible and youthful with simple layers."
      : ageBucket === "20s"
        ? "Lean into sharp modern basics and clean proportions."
        : ageBucket === "30s"
          ? "Prioritize refined staples with stronger fabric quality."
          : ageBucket === "40s"
            ? "Use structured tailoring with timeless color pairings."
            : ageBucket === "50plus"
              ? "Focus on elegant cuts, comfort, and premium textures."
              : "";

  const genderCue =
    gender === "male"
      ? "Favor masculine silhouette balance through shoulder and waist structure."
      : gender === "female"
        ? "Favor feminine silhouette balance with waist definition and soft layering."
        : gender === "androgynous"
          ? "Blend masculine and feminine pieces for a balanced androgynous look."
          : "";

  return [ageCue, genderCue].filter((text) => text.length > 0).join(" ");
}

function findWardrobeMatch(recommendation, wardrobeItems, category) {
  if (!wardrobeItems || wardrobeItems.length === 0) return null;

  const categoryMap = {
    topWear: "tops",
    bottomWear: "bottoms",
    footwear: "footwear",
    accessories: "accessories"
  };

  const wardrobeCategory = categoryMap[category];
  if (!wardrobeCategory) return null;

  const matches = wardrobeItems.filter(item => item.category === wardrobeCategory);
  if (matches.length === 0) return null;

  const match = matches[0];
  return `Your ${match.name} (${match.color})`;
}

export function buildShoppingLinks(suggestions, occasion, styleVibe) {
  const links = {};

  const buildSearchTerm = (item, category) => {
    const words = item.split(" ").slice(0, 4).join("+");
    return words;
  };

  const categories = ["topWear", "bottomWear", "footwear", "accessories"];
  categories.forEach(cat => {
    const item = suggestions[cat];
    if (!item) return;

    const searchTerm = buildSearchTerm(item, cat);
    const affiliateRetailers = SHOPPING_AFFILIATES[cat] || SHOPPING_AFFILIATES.accessories;

    links[cat] = affiliateRetailers.map(retailer => ({
      retailer: retailer.retailer,
      productName: item,
      url: `${retailer.baseUrl}${searchTerm}${retailer.affiliateTag || ""}`,
      price: undefined
    }))[0] || { retailer: "Search", productName: item, url: `https://www.google.com/search?q=${searchTerm}+buy` };
  });

  return links;
}

export function buildLookRecommendations({ occasion, styleVibe, analysis, variantToken, wardrobe }) {
  const vibe = styleVibe && styleVibe !== "" ? styleVibe : "Auto";
  const rules = OCCASION_RULES[occasion];
  const accents = STYLE_ACCENT[vibe] ?? STYLE_ACCENT.Auto;

  const ageBucket = toAgeBucket(analysis.demographicData?.age ?? null);
  const genderSeed = analysis.demographicData?.gender ?? "unknown";
  const baseKey = `${occasion}:${vibe}:${analysis.colorData.skinTone}:${analysis.faceData.shape}:${genderSeed}:${ageBucket}:${variantToken}`;

  const topWear = pick(rules.top, `${baseKey}:top`);
  const bottomWear = pick(rules.bottom, `${baseKey}:bottom`);
  const footwear = pick(rules.footwear, `${baseKey}:footwear`);
  const hairstyle = pick(rules.hairstyle, `${baseKey}:hair`);

  const accessories = `${pick(rules.accessories, `${baseKey}:acc`)}. ${accents.accessories}`;
  const demographicCue = buildDemographicStylingCue(analysis.demographicData);
  const confidenceTip = [accents.confidence, demographicCue, analysis.geminiSummary]
    .filter((text) => typeof text === "string" && text.trim().length > 0)
    .join(" ");

  const wardrobeMatches = {
    topWear: findWardrobeMatch(topWear, wardrobe, "topWear"),
    bottomWear: findWardrobeMatch(bottomWear, wardrobe, "bottomWear"),
    footwear: findWardrobeMatch(footwear, wardrobe, "footwear"),
    accessories: findWardrobeMatch(accessories, wardrobe, "accessories")
  };

  return {
    topWear,
    bottomWear,
    footwear,
    accessories,
    hairstyle,
    colorPalette: analysis.colorData.palette,
    confidenceTip,
    wardrobeMatches: Object.values(wardrobeMatches).some(Boolean) ? wardrobeMatches : undefined
  };
}
