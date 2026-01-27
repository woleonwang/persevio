import DragDropCards from "@/components/DragDropCards";

type CardType = "card1" | "card2" | "card3";

type CardConfig = {
  type: CardType;
  title: string;
  description: string;
};
const DragCardDemo = () => {
  return (
    <div>
      <div>123</div>
      <DragDropCards<CardType, CardConfig>
        initialData={{
          card1: [{ id: "1", title: "Card 1", description: "Description 1" }],
          card2: [],
          card3: [
            { id: "3", title: "Card 3", description: "Description 3" },
            { id: "4", title: "Card 4", description: "Description 4" },
          ],
        }}
        cardConfigs={[
          { type: "card1", title: "Card 1", description: "Description 1" },
          { type: "card2", title: "Card 2", description: "Description 2" },
          { type: "card3", title: "Card 3", description: "Description 3" },
        ]}
        renderHeader={() => <div>Header</div>}
      />
    </div>
  );
};

export default DragCardDemo;
