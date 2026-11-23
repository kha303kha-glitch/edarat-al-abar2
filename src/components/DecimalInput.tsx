import React from 'react';
import {sanitizeDecimalInput} from '../utils/format';

interface DecimalInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  unit?: string;
  required?: boolean;
  hint?: string;
  error?: string;
}

export const DecimalInput: React.FC<DecimalInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '0',
  unit,
  required = false,
  hint,
  error,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeDecimalInput(e.target.value);
    onChange(cleaned);
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800 mb-1.5">
        {label}
        {required && <span className="text-red-600 mr-1">*</span>}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-sm font-mono tabular-nums text-right text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
            unit ? 'pl-14' : ''
          } ${
            error
              ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
              : 'border-slate-300 focus:border-[#0F3D6E] focus:ring-sky-100'
          }`}
        />
        {unit && (
          <span className="pointer-events-none absolute left-3 text-xs font-medium text-slate-500">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
};
