export const copy = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

export const parseJSON = (jsonString?: string) => {
  if (!jsonString) return {};

  const startIndex = jsonString.indexOf("{");
  const lastIndex = jsonString.lastIndexOf("}");
  return JSON.parse(jsonString.slice(startIndex, lastIndex + 1));
};
