import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface EmailVerificationProps {
  email: string;
  onResendVerification: () => Promise<void>;
  isResending?: boolean;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onResendVerification,
  isResending,
}) => {
  return (
    <div className="container max-w-md mx-auto mt-16">
      <Card className="p-6 text-center">
        <div className="flex justify-center mb-4">
          <Mail className="h-12 w-12 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Zweryfikuj swój email</h1>
        
        <p className="mb-6 text-muted-foreground">
          Wysłaliśmy link weryfikacyjny na adres:
          <br />
          <span className="font-medium text-foreground">{email}</span>
        </p>
        
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={onResendVerification}
            disabled={isResending}
          >
            {isResending ? "Wysyłanie..." : "Wyślij link ponownie"}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            <a href="/auth/login" className="text-primary hover:underline">
              Powrót do logowania
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
};
