/**
 * Applies the 3-Tier Deep Search logic to an array of products.
 * 
 * Tier 1: Exact Name matches
 * Tier 2: Tag or Description matches
 * Tier 3: Related matches (products sharing tags with Tiers 1/2)
 * 
 * @param {Array} products - The array of products to search
 * @param {string} query - The search string
 * @param {string} sort - The sort mode (e.g. 'popular', 'price-asc')
 * @param {Function} sortFn - The sort function to apply to each tier independently
 * @returns {Array} The sorted and combined results
 */
export function applyDeepSearch(products, query, sort, sortFn) {
  if (!query || query.trim() === '') {
    return sortFn(products, sort);
  }

  const q = query.toLowerCase().trim();
  const nameMatches = [];
  const tagMatches = [];
  const relatedMatches = [];
  const matchedIds = new Set();
  const collectedTags = new Set();

  // A. Identify Tier 1 (Name Matches) and Tier 2 (Tag/Desc Matches)
  products.forEach(p => {
    const nameMatch = p.name?.toLowerCase().includes(q);
    const tagMatch = p.searchTags?.some(t => t.toLowerCase().includes(q));
    const descMatch = p.description?.toLowerCase().includes(q);

    let isMatched = false;

    if (nameMatch) {
      nameMatches.push(p);
      isMatched = true;
    } else if (tagMatch || descMatch) {
      tagMatches.push(p);
      isMatched = true;
    }

    if (isMatched) {
      matchedIds.add(p._id);
      if (Array.isArray(p.searchTags)) {
        p.searchTags.forEach(t => {
          if (t) collectedTags.add(t.toLowerCase().trim());
        });
      }
    }
  });

  // B. Identify Tier 3 (Related Matches - share tags with Tier 1/2)
  products.forEach(p => {
    if (!matchedIds.has(p._id)) {
      const hasSharedTag = p.searchTags?.some(t => t && collectedTags.has(t.toLowerCase().trim()));
      if (hasSharedTag) {
        relatedMatches.push(p);
      }
    }
  });

  // C. Sort each tier independently and combine
  const sortedNameMatches = sortFn(nameMatches, sort);
  const sortedTagMatches = sortFn(tagMatches, sort);
  const sortedRelatedMatches = sortFn(relatedMatches, sort);
  
  return [...sortedNameMatches, ...sortedTagMatches, ...sortedRelatedMatches];
}
