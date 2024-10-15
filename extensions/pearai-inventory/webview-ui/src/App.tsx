import InventoryPage from "./pages/InventoryPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TemplateComponent = ({ name }: { name: string }) => {
	return (
		<div className="flex items-center justify-center h-screen text-7xl">
			{name} here
		</div>
	);
};

const tabs = [
	{
        id: "aider",
		name: "Creator (aider)",
		component: <TemplateComponent name="aider" />,
    },
    { id: "inventory", name: "Inventory", component: <InventoryPage /> },
    {
        id: "perplexity",
        name: "Search (Perplexity)",
        component: <TemplateComponent name="Perplexity" />,
    },
];

export default function App() {
	return (
		<div className="h-full">
			<Tabs defaultValue="inventory" className="">
            <div className="flex justify-center mt-1">
				<TabsList className="bg-input text-center text-xs">
					{tabs.map((tab) => (
						<TabsTrigger key={tab.id} value={tab.id}>
							{tab.name}
						</TabsTrigger>
					))}
				</TabsList>
                </div>
				{tabs.map((tab) => (
					<TabsContent key={tab.id} value={tab.id} className="pb-4 pl-4 pr-4">
						{tab.component}
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
