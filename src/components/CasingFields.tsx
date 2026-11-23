import React from 'react';
import type {CasingType} from '../types/models';
import {DecimalInput} from './DecimalInput';

export interface CasingFormState {
  type: CasingType;
  fromDepth: string;
  toDepth: string;
}

interface CasingFieldsProps {
  value: CasingFormState;
  onChange: (next: CasingFormState) => void;
  idPrefix?: string;
}

export const CasingFields: React.FC<CasingFieldsProps> = ({
  value,
  onChange,
  idPrefix = 'casing',
}) => {
  const showRange = value.type === 'iron' || value.type === 'plastic';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <label htmlFor={`${idPrefix}-type`} className="text-sm font-semibold text-slate-900">
          قسم الإكساء
        </label>
        <select
          id={`${idPrefix}-type`}
          value={value.type}
          onChange={(e) => {
            const nextType = e.target.value as CasingType;
            onChange({
              type: nextType,
              fromDepth: nextType === 'none' ? '' : value.fromDepth,
              toDepth: nextType === 'none' ? '' : value.toDepth,
            });
          }}
          className="min-h-[44px] sm:w-56 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 focus:border-[#0F3D6E] focus:outline-none focus:ring-2 focus:ring-sky-100"
        >
          <option value="none">بلا</option>
          <option value="iron">إكساء حديد</option>
          <option value="plastic">إكساء بلاستيك</option>
        </select>
      </div>

      {showRange && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <DecimalInput
            id={`${idPrefix}-from`}
            label="يبدأ من عمق"
            value={value.fromDepth}
            onChange={(fromDepth) => onChange({...value, fromDepth})}
            unit="متر"
          />
          <DecimalInput
            id={`${idPrefix}-to`}
            label="ينتهي عند عمق"
            value={value.toDepth}
            onChange={(toDepth) => onChange({...value, toDepth})}
            unit="متر"
          />
        </div>
      )}
    </div>
  );
};
