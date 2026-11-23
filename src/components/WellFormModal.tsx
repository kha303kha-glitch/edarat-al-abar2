import React, {useEffect, useState} from 'react';
import {X, Save} from 'lucide-react';
import type {GeoCoordinates, Well, WellType} from '../types/models';
import {generateId, parseDecimalOrUndefined} from '../utils/format';
import {CasingFields, type CasingFormState} from './CasingFields';
import {DecimalInput} from './DecimalInput';
import {LocationField} from './LocationField';
import {SpringsFields, type SpringsFormState} from './SpringsFields';

interface WellFormModalProps {
  open: boolean;
  clientId: string;
  editingWell?: Well | null;
  onSave: (well: Well) => void;
  onClose: () => void;
}

export const WellFormModal: React.FC<WellFormModalProps> = ({
  open,
  clientId,
  editingWell,
  onSave,
  onClose,
}) => {
  const [type, setType] = useState<WellType>('new');
  const [name, setName] = useState('');
  const [location, setLocation] = useState<GeoCoordinates | undefined>(undefined);
  // New well fields
  const [diameter, setDiameter] = useState('');
  const [workStartDate, setWorkStartDate] = useState('');
  // Old well fields
  const [initialDepth, setInitialDepth] = useState('');
  const [initialCondition, setInitialCondition] = useState('');
  // Shared
  const [casing, setCasing] = useState<CasingFormState>({
    type: 'none',
    fromDepth: '',
    toDepth: '',
  });
  const [springs, setSprings] = useState<SpringsFormState>({
    firstDepth: '',
    secondDepth: '',
    thirdDepth: '',
  });
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    if (editingWell) {
      setType(editingWell.type);
      setName(editingWell.name);
      setLocation(editingWell.location);
      setDiameter(editingWell.diameter !== undefined ? String(editingWell.diameter) : '');
      setWorkStartDate(editingWell.workStartDate ?? '');
      setInitialDepth(editingWell.initialDepth !== undefined ? String(editingWell.initialDepth) : '');
      setInitialCondition(editingWell.initialCondition ?? '');
      setCasing({
        type: editingWell.casing.type,
        fromDepth:
          editingWell.casing.fromDepth !== undefined ? String(editingWell.casing.fromDepth) : '',
        toDepth: editingWell.casing.toDepth !== undefined ? String(editingWell.casing.toDepth) : '',
      });
      setSprings({
        firstDepth:
          editingWell.springs.firstDepth !== undefined ? String(editingWell.springs.firstDepth) : '',
        secondDepth:
          editingWell.springs.secondDepth !== undefined
            ? String(editingWell.springs.secondDepth)
            : '',
        thirdDepth:
          editingWell.springs.thirdDepth !== undefined ? String(editingWell.springs.thirdDepth) : '',
      });
    } else {
      setType('new');
      setName('');
      setLocation(undefined);
      setDiameter('');
      setWorkStartDate(new Date().toISOString().slice(0, 10));
      setInitialDepth('');
      setInitialCondition('');
      setCasing({type: 'none', fromDepth: '', toDepth: ''});
      setSprings({firstDepth: '', secondDepth: '', thirdDepth: ''});
    }
    setNameError(undefined);
  }, [open, editingWell]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('اسم البئر حقل إلزامي');
      return;
    }

    const now = new Date().toISOString();
    const record: Well = {
      id: editingWell?.id ?? generateId(),
      clientId: editingWell?.clientId ?? clientId,
      type,
      name: trimmedName,
      location,
      diameter: type === 'new' ? parseDecimalOrUndefined(diameter) : undefined,
      workStartDate: type === 'new' ? workStartDate || undefined : undefined,
      initialDepth: type === 'old' ? parseDecimalOrUndefined(initialDepth) : undefined,
      initialCondition: type === 'old' ? initialCondition.trim() || undefined : undefined,
      casing: {
        type: casing.type,
        fromDepth: casing.type === 'none' ? undefined : parseDecimalOrUndefined(casing.fromDepth),
        toDepth: casing.type === 'none' ? undefined : parseDecimalOrUndefined(casing.toDepth),
      },
      springs: {
        firstDepth: parseDecimalOrUndefined(springs.firstDepth),
        secondDepth: parseDecimalOrUndefined(springs.secondDepth),
        thirdDepth: parseDecimalOrUndefined(springs.thirdDepth),
      },
      createdAt: editingWell?.createdAt ?? now,
      updatedAt: editingWell ? now : undefined,
    };

    onSave(record);
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="well-modal-title"
    >
      <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
          <h2 id="well-modal-title" className="font-display text-lg font-bold text-slate-900">
            {editingWell ? 'تعديل بيانات البئر' : 'إضافة بئر جديد'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5">
          {/* Well Type Switcher */}
          <div>
            <span className="block text-sm font-medium text-slate-800 mb-2">نوع البئر</span>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setType('new')}
                className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                  type === 'new'
                    ? 'bg-[#0F3D6E] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                بئر جديد (حفر جديد)
              </button>
              <button
                type="button"
                onClick={() => setType('old')}
                className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                  type === 'old'
                    ? 'bg-[#0F3D6E] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                بئر قديم (صيانة / تطوير)
              </button>
            </div>
          </div>

          {/* Well Name */}
          <div>
            <label htmlFor="well-name" className="block text-sm font-medium text-slate-800 mb-1.5">
              اسم البئر <span className="text-red-600">*</span>
            </label>
            <input
              id="well-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(undefined);
              }}
              placeholder="مثال: البئر الشمالي أو بئر المزرعة رقم 1"
              className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                nameError
                  ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                  : 'border-slate-300 focus:border-[#0F3D6E] focus:ring-sky-100'
              }`}
            />
            {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
          </div>

          {/* Conditional Fields based on Well Type */}
          {type === 'new' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DecimalInput
                id="well-diameter"
                label="قطر البئر المطلوب"
                value={diameter}
                onChange={setDiameter}
                unit="بوصة"
                placeholder="مثال: 10"
              />
              <div>
                <label
                  htmlFor="well-start-date"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  تاريخ بدء العمل
                </label>
                <input
                  id="well-start-date"
                  type="date"
                  value={workStartDate}
                  onChange={(e) => setWorkStartDate(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#0F3D6E] focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <DecimalInput
                id="well-initial-depth"
                label="عمق البئر قبل البدء"
                value={initialDepth}
                onChange={setInitialDepth}
                unit="متر"
                placeholder="مثال: 120"
              />
              <div>
                <label
                  htmlFor="well-condition"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  شرح / وصف عن حالة البئر قبل العمل
                </label>
                <textarea
                  id="well-condition"
                  rows={3}
                  value={initialCondition}
                  onChange={(e) => setInitialCondition(e.target.value)}
                  placeholder="وصف حالة جدران البئر، الترسبات، وجود انهيارات، أو وضع المضخة السابقة..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F3D6E] focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
          )}

          {/* Location */}
          <LocationField
            label="مكان البئر — الإحداثيات الجغرافية (اختياري)"
            value={location}
            onChange={setLocation}
          />

          {/* Casing */}
          <CasingFields value={casing} onChange={setCasing} idPrefix="well-casing" />

          {/* Springs */}
          <SpringsFields value={springs} onChange={setSprings} idPrefix="well-springs" />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-[#0F3D6E] text-sm font-semibold text-white hover:bg-[#0B2E54] transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{editingWell ? 'حفظ التعديلات' : 'حفظ البئر'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
