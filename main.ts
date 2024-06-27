import { generateVector } from "./transformer";
import {
  createIndex,
  addItem,
  searchSimilarItems,
  closeRedisClient,
} from "./redis";

interface Item {
  id: string;
  name: string;
  vector: number[];
}

async function main() {
  try {
    // create the index on Redis
    await createIndex();

    // add items
    const items: Item[] = [
      {
        id: "1",
        name: "love",
        vector: [],
      },
      {
        id: "2",
        name: "sports",
        vector: [],
      },
      {
        id: "3",
        name: "music",
        vector: [],
      },
    ];

    for (const item of items) {
      item.vector = await generateVector(item.name);
      await addItem(item);
    }

    // search for similar items
    const queryVector = await generateVector("football");
    const similarItems = await searchSimilarItems(queryVector, 2);
    console.log("Similar items:", similarItems);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await closeRedisClient();
  }
}

main();
