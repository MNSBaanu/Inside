const STOP_WORDS = new Set([
  'about',
  'also',
  'and',
  'any',
  'are',
  'but',
  'can',
  'for',
  'from',
  'has',
  'have',
  'into',
  'its',
  'just',
  'like',
  'more',
  'our',
  'out',
  'over',
  'should',
  'some',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'very',
  'want',
  'was',
  'were',
  'what',
  'when',
  'which',
  'while',
  'will',
  'with',
  'would',
  'you',
  'your',
]);

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+/g) ?? [])
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .map((word) =>
      word.length > 4 && word.endsWith('s') && !word.endsWith('ss')
        ? word.slice(0, -1)
        : word,
    );
}

/**
 * Cosine similarity (0–1) of the query to each document, using TF-IDF weights
 * computed over the query and all documents together.
 */
export function similarities(query: string, documents: string[]): number[] {
  const corpus = [query, ...documents].map(tokenize);

  const documentFrequency = new Map<string, number>();
  for (const tokens of corpus) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const size = corpus.length;
  const vectors = corpus.map((tokens) => {
    const counts = new Map<string, number>();
    for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
    const vector = new Map<string, number>();
    for (const [token, count] of counts) {
      const idf =
        Math.log((size + 1) / ((documentFrequency.get(token) ?? 0) + 1)) + 1;
      vector.set(token, count * idf);
    }
    return vector;
  });

  const length = (vector: Map<string, number>) =>
    Math.sqrt([...vector.values()].reduce((sum, w) => sum + w * w, 0));

  const [queryVector, ...documentVectors] = vectors;
  const queryLength = length(queryVector);

  return documentVectors.map((vector) => {
    const documentLength = length(vector);
    if (!queryLength || !documentLength) return 0;
    let dot = 0;
    for (const [token, weight] of queryVector) {
      dot += weight * (vector.get(token) ?? 0);
    }
    return dot / (queryLength * documentLength);
  });
}
