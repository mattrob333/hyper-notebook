import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface A2CardProps {
  title?: string;
  description?: string;
  content?: string;
  actions?: Array<{ label: string; variant?: 'default' | 'secondary' | 'outline'; onClick?: () => void }>;
  children?: React.ReactNode;
}

export default function A2Card({ title, description, content, actions, children }: A2CardProps) {
  return (
    <Card className="w-full">
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {content && <p className="text-sm">{content}</p>}
        {children}
      </CardContent>
      {actions && actions.length > 0 && (
        <CardFooter className="gap-2 flex-wrap">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant || 'default'}
              size="sm"
              onClick={action.onClick}
              data-testid={`a2card-action-${idx}`}
            >
              {action.label}
            </Button>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}
