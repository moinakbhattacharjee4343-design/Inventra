import { ProductCategory } from "../types/inventory";

/**
 * High-resolution studio product photographs stored locally in /src/assets/images/.
 * Every single one of the 100 catalog SKUs maps to its own distinct photograph.
 */
const DEDICATED_PHOTOS: Record<string, string> = {
  "basmati-rice-5kg": "/src/assets/images/prod_basmati_rice_1795614546737.jpg",
  "cooking-oil-1l": "/src/assets/images/prod_mustard_oil_1795614547979.jpg",
  "toor-dal-1kg": "/src/assets/images/prod_toor_dal_1795614548376.jpg",
  "tea-powder-500g": "/src/assets/images/prod_masala_chai_1795614551036.jpg",
  "packaged-milk-1l": "/src/assets/images/prod_organic_milk_1795614549308.jpg",
  "coffee-beans-250g": "/src/assets/images/prod_arabica_coffee_1795614548588.jpg",
  "sunscreen-spf-50": "/src/assets/images/prod_sunscreen_1795614552244.jpg",
  "hand-sanitizer-500ml": "/src/assets/images/prod_sanitizer_1795614552120.jpg",
  "cough-syrup-100ml": "/src/assets/images/prod_cough_syrup_1795614551933.jpg",
  "ors-sachets-10ct": "/src/assets/images/prod_electrolyte_1795614551328.jpg",
};

const SLICED_SKU_IDS = new Set<string>([
  "wheat-flour-10kg",
  "sugar-1kg",
  "iodized-salt-1kg",
  "ghee-500ml",
  "instant-noodles-5-pack",
  "cream-biscuits-family-pack",
  "eggs-tray-30",
  "butter-500g",
  "cheese-slices-200g",
  "curd-400g",
  "sliced-bread",
  "paneer-200g",
  "fresh-fruit-juice-1l",
  "bananas-1-dozen",
  "tomatoes-1kg",
  "bottled-water-1l",
  "soft-drink-2l",
  "energy-drink-250ml",
  "potato-chips-large",
  "chocolate-bar",
  "roasted-almonds-200g",
  "instant-coffee-100g",
  "ice-cream-tub-700ml",
  "protein-bar",
  "shampoo-340ml",
  "conditioner-180ml",
  "soap-4-pack",
  "toothpaste-150g",
  "toothbrush",
  "face-wash",
  "body-lotion-400ml",
  "deodorant",
  "razor-5-pack",
  "paracetamol-strip",
  "multivitamin-60ct",
  "bandage-pack",
  "face-masks-50ct",
  "digital-thermometer",
  "vitamin-c-tablets",
  "pain-relief-spray",
  "plain-cotton-t-shirt",
  "regular-fit-jeans",
  "formal-shirt",
  "sneakers",
  "socks-3-pack",
  "innerwear-3-pack",
  "leather-belt",
  "handbag",
  "winter-jacket",
  "kurta",
  "phone-charger-20w",
  "usb-c-cable",
  "wireless-earbuds",
  "power-bank-10000mah",
  "phone-case",
  "screen-guard",
  "memory-card-64gb",
  "bluetooth-speaker",
  "smartwatch",
  "aa-batteries-8-pack",
  "led-bulb-9w",
  "double-bedsheet-set",
  "bath-towel",
  "storage-container-set",
  "steel-water-bottle",
  "non-stick-pan",
  "pressure-cooker-5l",
  "floor-cleaner-1l",
  "detergent-powder-2kg",
  "dishwash-liquid-750ml",
  "notebook-200-pages",
  "ball-pens-10-pack",
  "a4-printer-paper-500-sheets",
  "marker-set",
  "geometry-box",
  "school-bag",
  "highlighters-5-pack",
  "sticky-notes",
  "stapler",
  "childrens-story-book",
  "board-game",
  "soft-toy",
  "building-blocks",
  "cricket-bat",
  "football",
  "badminton-racket-set",
  "yoga-mat",
  "diwali-decorative-lights",
  "christmas-tree-decor",
  "umbrella",
]);

const REAL_PRODUCT_PHOTOS: Record<string, string> = {
  ...DEDICATED_PHOTOS,
  ...Object.fromEntries(
    Array.from(SLICED_SKU_IDS).map((id) => [id, `/src/assets/images/sku_${id}.jpg`])
  ),
};

interface PaletteSpec {
  bg1: string;
  bg2: string;
  accent: string;
  ink: string;
}

const DEPT_PALETTES: Record<ProductCategory, PaletteSpec> = {
  "Grocery Staples": { bg1: "#EEF2FF", bg2: "#E0E7FF", accent: "#3B6FE0", ink: "#1B1240" },
  "Dairy, Bakery & Fresh": { bg1: "#ECFEFF", bg2: "#CFFAFE", accent: "#2BB5C9", ink: "#134E4A" },
  "Beverages & Snacks": { bg1: "#FFF7ED", bg2: "#FFEDD5", accent: "#EF7B45", ink: "#7C2D12" },
  "Personal Care": { bg1: "#FDF2F8", bg2: "#FCE7F3", accent: "#E26BA6", ink: "#701A75" },
  "Pharmacy & Wellness": { bg1: "#F5F3FF", bg2: "#EDE9FE", accent: "#9B6BFF", ink: "#3B0764" },
  "Fashion & Apparel": { bg1: "#FEFCE8", bg2: "#FEF08A", accent: "#D9A441", ink: "#713F12" },
  "Electronics & Accessories": { bg1: "#F1F5F9", bg2: "#E2E8F0", accent: "#7C86A2", ink: "#14112B" },
  "Home & Kitchen": { bg1: "#F7FEE7", bg2: "#ECFCCB", accent: "#8BC34A", ink: "#365314" },
  "Stationery & Books": { bg1: "#F0FDFA", bg2: "#CCFBF1", accent: "#1FB89A", ink: "#134E4A" },
  "Toys, Sports & Seasonal": { bg1: "#FFF1F2", bg2: "#FFE4E6", accent: "#C2415D", ink: "#881337" },
};

const SVG_CACHE = new Map<string, string>();

export function getProductImageUrl(
  id: string,
  name: string,
  category: ProductCategory
): string {
  const realPhoto = REAL_PRODUCT_PHOTOS[id];
  if (realPhoto) return realPhoto;

  const cacheKey = `${id}::${category}`;
  const cached = SVG_CACHE.get(cacheKey);
  if (cached) return cached;

  const palette = DEPT_PALETTES[category] ?? DEPT_PALETTES["Grocery Staples"];
  const monogram = name.slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bg1}"/>
        <stop offset="100%" stop-color="${palette.bg2}"/>
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="12" fill="url(#bg)"/>
    <rect x="20" y="19" width="24" height="26" rx="5" fill="${palette.accent}" stroke="${palette.ink}" stroke-width="2"/>
    <rect x="24" y="25" width="16" height="8" rx="2" fill="#FFFFFF" opacity="0.9"/>
    <circle cx="32" cy="39" r="3" fill="#FFFFFF" opacity="0.85"/>
    <text x="7" y="13" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="${palette.ink}" opacity="0.6">${monogram}</text>
  </svg>`;

  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  SVG_CACHE.set(cacheKey, uri);
  return uri;
}
