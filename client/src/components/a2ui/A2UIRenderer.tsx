import { motion } from "framer-motion";
import A2Card from "./catalog/A2Card";
import A2Form from "./catalog/A2Form";
import A2DataTable from "./catalog/A2DataTable";
import type { A2UIComponent } from "@/lib/types";

interface A2UIRendererProps {
  uiStream: A2UIComponent[];
}

const componentMap: Record<string, React.ComponentType<any>> = {
  card: A2Card,
  form: A2Form,
  datatable: A2DataTable,
};

export default function A2UIRenderer({ uiStream }: A2UIRendererProps) {
  const rootComponents = uiStream.filter(c => !c.parentId);

  const renderComponent = (component: A2UIComponent): React.ReactNode => {
    const Component = componentMap[component.type];
    
    if (!Component) {
      console.warn(`Unknown A2UI component type: ${component.type}`);
      return null;
    }

    const children = uiStream.filter(c => c.parentId === component.id);
    
    return (
      <motion.div
        key={component.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        data-testid={`a2ui-component-${component.id}`}
      >
        <Component {...component.properties} data={component.data}>
          {children.map(child => renderComponent(child))}
        </Component>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {rootComponents.map(component => renderComponent(component))}
    </div>
  );
}
