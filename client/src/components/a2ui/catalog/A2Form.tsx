import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

interface A2FormProps {
  title?: string;
  fields: FormField[];
  submitLabel?: string;
  onSubmit?: (values: Record<string, string>) => void;
}

export default function A2Form({ title, fields, submitLabel = "Submit", onSubmit }: A2FormProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(values);
    console.log('Form submitted:', values);
  };

  const updateValue = (id: string, value: string) => {
    setValues({ ...values, [id]: value });
  };

  return (
    <Card className="w-full">
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.id}
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  required={field.required}
                  data-testid={`a2form-field-${field.id}`}
                />
              ) : field.type === 'select' && field.options ? (
                <Select 
                  value={values[field.id]} 
                  onValueChange={(v) => updateValue(field.id, v)}
                >
                  <SelectTrigger data-testid={`a2form-field-${field.id}`}>
                    <SelectValue placeholder={field.placeholder || 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  required={field.required}
                  data-testid={`a2form-field-${field.id}`}
                />
              )}
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button type="submit" data-testid="a2form-submit">{submitLabel}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
