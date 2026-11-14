const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const context = vm.createContext({});
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "../js/smart-search.js"), "utf8"),
  context
);

const products = [
  { name: "Business Laptop", category: "Computers", price: 2400 },
  { name: "Gaming Laptop", category: "Computers", description: "Business ready", price: 1900 },
  { name: "USB-C Cable", category: "Accessories", price: 49 },
  { name: "Laptop Sleeve", category: "Accessories", price: 200 },
  { name: "USB-C Dock", category: "Accessories", price: 201 },
  { name: "Office Chair", category: "Furniture", price: 199 }
];

function names(query, catalogue = products) {
  return Array.from(context.smartSearch(query, catalogue), product => product.name);
}

test("ranks matches across name, description and category", () => {
  assert.deepEqual(names("BUSINESS laptop, computers"), ["Business Laptop", "Gaming Laptop", "Laptop Sleeve"]);
});

test("requires a keyword match within the inclusive price limit", () => {
  assert.deepEqual(names("accessories under 200"), ["USB-C Cable", "Laptop Sleeve"]);
  assert.deepEqual(names("accessories below 49.50"), ["USB-C Cable"]);
});

test("shows no results for a synonym without a literal match", () => {
  assert.deepEqual(names("cheap notebook"), []);
});

test("handles price-only, empty, and zero-limit searches", () => {
  assert.deepEqual(names("under 50"), ["USB-C Cable"]);
  assert.deepEqual(names("a"), []);
  assert.deepEqual(names("below 0"), []);
});

test("returns at most five results without mutating the catalogue", () => {
  const catalogue = Object.freeze(Array.from({ length: 7 }, (_, i) => ({ name: "Laptop " + i, price: i })));
  assert.deepEqual(names("laptop", catalogue), ["Laptop 0", "Laptop 1", "Laptop 2", "Laptop 3", "Laptop 4"]);
});
