import React from 'react';
import {DecimalInput} from './DecimalInput';

export interface SpringsFormState {
  firstDepth: string;
  secondDepth: string;
  thirdDepth: string;
}

interface SpringsFieldsProps {
  value: SpringsFormState;
  onChange: (next: SpringsFormState) => void;
  idPrefix?: string;
}

export const SpringsFields: React.FC<SpringsFieldsProps> = ({
  value,
  onChange,
  idPrefix = 'springs',
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">معلومات عند الحفر (النبوع)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DecimalInput
          id={`${idPrefix}-first`}
          label="نبع أول على عمق"
          value={value.firstDepth}
          onChange={(firstDepth) => onChange({...value, firstDepth})}
          unit="متر"
        />
        <DecimalInput
          id={`${idPrefix}-second`}
          label="نبع ثاني على عمق"
          value={value.secondDepth}
          onChange={(secondDepth) => onChange({...value, secondDepth})}
          unit="متر"
        />
        <DecimalInput
          id={`${idPrefix}-third`}
          label="نبع ثالث على عمق"
          value={value.thirdDepth}
          onChange={(thirdDepth) => onChange({...value, thirdDepth})}
          unit="متر"
        />
      </div>
    </div>
  );
};
