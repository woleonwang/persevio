export const copy = async (text: string) => {
  await navigator.clipboard.writeText(text);
};
