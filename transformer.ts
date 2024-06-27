const TransformersApi = Function('return import("@xenova/transformers")')();

async function generateVector(sentence: string): Promise<number[]> {
  const model = "Xenova/all-distilroberta-v1";
  const { pipeline } = await TransformersApi;

  const pipe = await pipeline("feature-extraction", model);

  const output = await pipe(sentence, {
    pooling: "mean",
    normalize: true,
  });

  return Object.values(output?.data);
}

export { generateVector };
