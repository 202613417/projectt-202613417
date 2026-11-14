function scoreProduct(product, queryWords) {
  const text = [product.name, product.description, product.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return queryWords.reduce((score, word) => score + Number(text.includes(word)), 0);
}

function smartSearch(query, products) {
  const priceRule = /\b(?:under|below)\s+(\d+(?:\.\d+)?)(?![\w.])/gi;
  const priceLimits = [...query.matchAll(priceRule)].map(match => Number(match[1]));
  const maxPrice = priceLimits.length ? Math.min(...priceLimits) : Infinity;
  const words = new Set(query.replace(priceRule, " ").toLowerCase().match(/[\p{L}\p{N}]+/gu));
  const queryWords = [...words].filter(word => word.length > 2);

  if (!queryWords.length && !priceLimits.length) return [];

  return products
    .filter(product => product.price <= maxPrice)
    .map(product => ({ product, score: scoreProduct(product, queryWords) }))
    .filter(result => !queryWords.length || result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(result => result.product);
}
