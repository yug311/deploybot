import { pipeline } from '@xenova/transformers';
import fs from 'fs';

// Load model
const extractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32');

// For text - this works as you had it
const textEmbedding = await extractor('Tweet: Everyone is truly alone in life. Name: Alone; Ticker: Alone', { pooling: 'mean', normalize: true });
const imageEmbedding = await extractor('https://axiomtrading-v2.axiom-cdn.io/HY9UuTa1wYEPx3gx38k1zsChF7pWAmrQFtuAwFSUpump.webp', { pooling: 'mean', normalize: true });

function cosineSimilarity(a, b) {
  const dotProduct = a.data.reduce((sum, val, i) => sum + val * b.data[i], 0);
  return dotProduct;
}

const similarity = cosineSimilarity(textEmbedding, imageEmbedding);
console.log(similarity);




