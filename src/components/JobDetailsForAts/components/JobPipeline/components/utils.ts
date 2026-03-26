export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export { default as DraggableCard } from "./DraggableCard";
export { default as DroppableColumn } from "./DroppableColumn";
