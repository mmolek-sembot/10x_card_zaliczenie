import React from "react";
import { Textarea } from "@/components/ui/textarea";
import type { TextInputProps } from "./types";

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  minLength,
  maxLength,
  placeholder = "Wprowadź tekst...",
  disabled = false,
  error
}) => {
  const charCount = value.length;
  const isValid = charCount >= minLength && charCount <= maxLength;
  
  const getCounterColor = () => {
    if (disabled) return "text-gray-400";
    if (charCount < minLength) return "text-red-500";
    if (charCount > maxLength) return "text-red-500";
    if (charCount > maxLength * 0.9) return "text-amber-500";
    return "text-gray-500";
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`min-h-[200px] ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
      />
      
      <div className="flex justify-between text-sm">
        <div className={error ? "text-red-500" : "text-gray-500"}>
          {error || `Min. ${minLength} znaków`}
        </div>
        <div className={getCounterColor()}>
          {charCount}/{maxLength}
        </div>
      </div>
    </div>
  );
}; 