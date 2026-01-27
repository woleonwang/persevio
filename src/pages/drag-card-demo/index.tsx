import DragDropCards from "@/components/DragDropCards";

const DragCardDemo = () => {
  return (
    <div>
      <div>123</div>
      <DragDropCards
        initialData={{
          card1: [{ id: "1", title: "Card 1", description: "Description 1" }],
        }}
        cardConfigs={[]}
        renderHeader={() => <div>Header</div>}
      />
    </div>
  );
};

export default DragCardDemo;
