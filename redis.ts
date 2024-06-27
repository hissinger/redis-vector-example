import {
  createClient,
  RediSearchSchema,
  SchemaFieldTypes,
  VectorAlgorithms,
} from "redis";

let redisClient: any;

// create a Redis client
async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: "redis://localhost:6379",
    });
    await redisClient.connect();
  }
  return redisClient;
}

async function closeRedisClient() {
  if (redisClient) {
    await redisClient.quit();
  }
}

// index name
const INDEX_NAME = "idx:item";

// vector dimension
const VECTOR_DIM = 768;

// create a RediSearch index
async function createIndex() {
  const client = await getRedisClient();

  const schema: RediSearchSchema = {
    "$.vector": {
      type: SchemaFieldTypes.VECTOR,
      ALGORITHM: VectorAlgorithms.FLAT,
      TYPE: "FLOAT32",
      DIM: VECTOR_DIM,
      DISTANCE_METRIC: "COSINE",
      AS: "vector",
    },
    "$.name": {
      type: SchemaFieldTypes.TEXT,
      SORTABLE: true,
      AS: "name",
    },
  };

  // ensure the index does not exist
  try {
    await client.ft.dropIndex(INDEX_NAME);
  } catch (err) {
    console.log("No existing index to drop");
  }

  await client.ft.create(INDEX_NAME, schema, {
    ON: "JSON",
    PREFIX: "item:",
  });
}

// add an item to the index
async function addItem(item: any) {
  const client = await getRedisClient();

  await client.json.set(`item:${item.id}`, "$", {
    ...item,
  });
}

// search for similar items
async function searchSimilarItems(queryVector: number[], k: number = 5) {
  const client = await getRedisClient();
  const searchQuery = `*=>[KNN ${k} @vector $query_vector AS score]`;

  try {
    const results = await client.ft.search(INDEX_NAME, searchQuery, {
      PARAMS: {
        query_vector: Buffer.from(new Float32Array(queryVector).buffer),
      },
      RETURN: ["score", "name"],
      SORTBY: {
        BY: "score",
      },
      DIALECT: 2,
    });

    return results.documents.map((doc: any) => ({
      id: doc.id.split(":")[1],
      name: doc.value.name as string,
      score: doc.value.score as number,
    }));
  } catch (err) {
    console.error("Error searching:", err);
    return [];
  }
}

export { createIndex, searchSimilarItems, addItem, closeRedisClient };
