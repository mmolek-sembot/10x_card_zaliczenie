import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Check, X, Save, RotateCcw } from "lucide-react";

interface FlashcardsSummaryProps {
  totalCount: number;
  acceptedCount: number;
  rejectedCount: number;
  onSave: () => Promise<void>;
  onReset: () => void;
  isLoading: boolean;
  isComplete: boolean;
}

export const FlashcardsSummary: React.FC<FlashcardsSummaryProps> = ({
  totalCount,
  acceptedCount,
  rejectedCount,
  onSave,
  onReset,
  isLoading,
  isComplete
}) => {
  const pendingCount = totalCount - acceptedCount - rejectedCount;
  const hasAccepted = acceptedCount > 0;
  
  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4">
        <div className="text-lg font-medium mb-4">Podsumowanie</div>
        
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Suma</div>
            <div className="text-xl font-semibold">{totalCount}</div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Zaakceptowane</div>
            <div className="text-xl font-semibold text-green-600 flex items-center">
              <Check className="h-4 w-4 mr-1" />
              {acceptedCount}
            </div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Odrzucone</div>
            <div className="text-xl font-semibold text-red-600 flex items-center">
              <X className="h-4 w-4 mr-1" />
              {rejectedCount}
            </div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Oczekujące</div>
            <div className="text-xl font-semibold text-amber-600">{pendingCount}</div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-end gap-3">
        {isComplete ? (
          <Button 
            variant="outline"
            onClick={onReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Generuj ponownie
          </Button>
        ) : (
          <>
            {!isLoading && (
              <Button 
                variant="outline"
                onClick={onReset}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Anuluj
              </Button>
            )}
            
            <Button
              onClick={onSave}
              disabled={!hasAccepted || isLoading || pendingCount > 0}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Zapisywanie..." : "Zapisz fiszki"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}; 