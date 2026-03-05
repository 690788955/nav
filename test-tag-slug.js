const { transliterate } = require("transliteration");

function generateTagSlug(name) {
  const transliterated = transliterate(name);
  
  return transliterated
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Test cases
const testCases = [
  { input: "人工智能", expected: "ren-gong-zhi-neng" },
  { input: "AI Tools", expected: "ai-tools" },
  { input: "前端开发", expected: "qian-duan-kai-fa" },
  { input: "Design & UX", expected: "design-ux" },
];

console.log("Testing generateTagSlug function...\n");

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }) => {
  const result = generateTagSlug(input);
  const status = result === expected ? "✓ PASS" : "✗ FAIL";
  
  if (result === expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`${status}: "${input}" → "${result}" (expected: "${expected}")`);
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
