import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface EditableTextareaProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder: string;
  label: string;
  error?: string;
  rows?: number;
}

export const EditableTextarea: React.FC<EditableTextareaProps> = ({
  value,
  onChange,
  maxLength,
  placeholder,
  label,
  error,
  rows = 3,
}) => {
  const charCount = value.length;
  const isExceeding = charCount > maxLength;

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className={`text-xs ${isExceeding ? 'text-red-500' : 'text-gray-500'}`}>
          {charCount}/{maxLength}
        </span>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
      />

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};
