import React from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AuthFormProps {
  title: string;
  error?: string;
  children: React.ReactNode;
}

export const AuthForm: React.FC<AuthFormProps> = ({ title, error, children }) => {
  return (
    <div className="container max-w-md mx-auto mt-16">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">{title}</h1>
        {children}
      </Card>
    </div>
  );
};
