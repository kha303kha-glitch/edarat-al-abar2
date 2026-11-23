import React, {useRef, useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {Directory, Encoding, Filesystem} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {AlertTriangle, Download, Share2, Upload, X} from 'lucide-react';
import {buildBackupPayload, parseAndValidateBackup, type AppDatabaseState} from '../db/storage';
import type {BackupPayload} from '../types/models';
import {formatDateTimeArabic, formatNumber} from '../utils/format';

interface BackupModalProps {
  open: boolean;
  dbState: AppDatabaseState;
  onRestore: (payload: BackupPayload) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  open,
  dbState,
  onRestore,
  onNotify,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BackupPayload | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  if (!open) return null;

  const getBackupFile = () => {
    const payload = buildBackupPayload(dbState);
    const json = JSON.stringify(payload, null, 2);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `well-management-backup-${dateStamp}.json`;
    const blob = new Blob([json], {type: 'application/json'});
    return {json, fileName, blob};
  };

  const handleDownloadBackup = async () => {
    const {json, fileName, blob} = getBackupFile();

    if (Capacitor.isNativePlatform()) {
      try {
        const saved = await Filesystem.writeFile({
          path: fileName,
          data: json,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        onNotify('success', `تم حفظ النسخة الاحتياطية في المستندات: ${fileName}`);
        await Share.share({
          title: 'نسخة احتياطية — إدارة الآبار',
          url: saved.uri,
          dialogTitle: 'حفظ أو إرسال النسخة الاحتياطية',
        });
      } catch {
        onNotify('error', 'تعذر حفظ ملف النسخة الاحتياطية على الجهاز.');
      }
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify('success', 'تم تنزيل ملف النسخة الاحتياطية بنجاح.');
  };

  const handleShareBackup = async () => {
    const {json, fileName, blob} = getBackupFile();

    if (Capacitor.isNativePlatform()) {
      try {
        const cached = await Filesystem.writeFile({
          path: fileName,
          data: json,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });
        await Share.share({
          title: 'نسخة احتياطية — إدارة الآبار',
          text: `نسخة احتياطية كاملة (${dbState.clients.length} عملاء، ${dbState.wells.length} آبار، ${dbState.actions.length} إجراءات)`,
          url: cached.uri,
          dialogTitle: 'مشاركة النسخة الاحتياطية',
        });
        onNotify('success', 'تمت مشاركة ملف النسخة الاحتياطية.');
      } catch {
        onNotify('error', 'تعذر مشاركة ملف النسخة الاحتياطية.');
      }
      return;
    }

    const file = new File([blob], fileName, {type: 'application/json'});

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const shareData: ShareData = {
          title: 'نسخة احتياطية — إدارة الآبار',
          text: `نسخة احتياطية كاملة (${dbState.clients.length} عملاء، ${dbState.wells.length} آبار، ${dbState.actions.length} إجراءات)`,
          files: [file],
        };
        if (navigator.canShare && navigator.canShare({files: [file]})) {
          await navigator.share(shareData);
          onNotify('success', 'تمت مشاركة ملف النسخة الاحتياطية.');
          return;
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback: download file when Web Share with files isn't available
    await handleDownloadBackup();
    onNotify('info', 'تم حفظ الملف محلياً؛ يمكنك إرساله عبر واتساب أو تيليجرام أو Drive.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError(null);
    setPendingRestore(null);

    try {
      const text = await file.text();
      const validated = parseAndValidateBackup(text);
      setPendingRestore(validated);
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : 'تعذر قراءة ملف النسخة الاحتياطية.');
    }
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setRestoring(true);
    try {
      await onRestore(pendingRestore);
      setPendingRestore(null);
      onClose();
    } catch {
      setRestoreError('حدث خطأ أثناء استعادة البيانات.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
    >
      <div className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
          <h2 id="backup-modal-title" className="font-display text-lg font-bold text-slate-900">
            النسخ الاحتياطي والاستعادة
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

        <div className="overflow-y-auto p-5 space-y-6">
          {/* Current Local DB Summary */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-xs font-semibold text-slate-500 mb-2">
              ملخص البيانات المحفوظة محلياً على هذا الجهاز
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-lg bg-white border border-slate-200 py-2.5 px-2">
                <div className="font-mono text-lg font-bold tabular-nums text-slate-900">
                  {formatNumber(dbState.clients.length)}
                </div>
                <div className="text-xs text-slate-500">عميل</div>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 py-2.5 px-2">
                <div className="font-mono text-lg font-bold tabular-nums text-slate-900">
                  {formatNumber(dbState.wells.length)}
                </div>
                <div className="text-xs text-slate-500">بئر</div>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 py-2.5 px-2">
                <div className="font-mono text-lg font-bold tabular-nums text-slate-900">
                  {formatNumber(dbState.actions.length)}
                </div>
                <div className="text-xs text-slate-500">إجراء</div>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 py-2.5 px-2">
                <div className="font-mono text-lg font-bold tabular-nums text-slate-900">
                  {formatNumber(dbState.surveyPoints.length)}
                </div>
                <div className="text-xs text-slate-500">نقطة مسح</div>
              </div>
            </div>
          </div>

          {/* Export & Share */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold text-slate-900">
              إنشاء ومشاركة نسخة احتياطية (JSON)
            </h3>
            <p className="text-xs leading-relaxed text-slate-600">
              تشمل النسخة الاحتياطية جميع العملاء، الآبار، الإجراءات والمبالغ، ونقاط ما قبل الحفر.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F3D6E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2E54] transition-colors whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                <span>تنزيل ملف النسخة</span>
              </button>
              <button
                type="button"
                onClick={handleShareBackup}
                className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <Share2 className="h-4 w-4 text-[#0F3D6E]" />
                <span>مشاركة (واتساب / Drive)</span>
              </button>
            </div>
          </div>

          {/* Restore */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="font-display text-sm font-bold text-slate-900">
              استعادة من نسخة احتياطية
            </h3>
            <p className="text-xs leading-relaxed text-slate-600">
              اختر ملف <span className="font-mono">.json</span> محفوظ مسبقاً لاستعادة البيانات.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="sr-only"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Upload className="h-4 w-4 text-[#0F3D6E]" />
              <span>اختيار ملف نسخة احتياطية للاستعادة</span>
            </button>

            {restoreError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {restoreError}
              </div>
            )}

            {pendingRestore && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs text-amber-950">
                    <p className="font-bold text-sm">
                      تحذير: الاستعادة ستستبدل جميع البيانات الحالية!
                    </p>
                    <p>
                      تاريخ النسخة: {formatDateTimeArabic(pendingRestore.exportedAt)} · تحتوي على{' '}
                      {pendingRestore.clients.length} عميل، {pendingRestore.wells.length} بئر،{' '}
                      {pendingRestore.actions.length} إجراء، و {pendingRestore.surveyPoints.length}{' '}
                      نقطة مسح.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingRestore(null)}
                    className="min-h-[40px] px-4 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={restoring}
                    onClick={handleConfirmRestore}
                    className="min-h-[40px] px-4 py-1.5 rounded-lg bg-red-700 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                  >
                    {restoring ? 'جاري الاستعادة...' : 'تأكيد الكتابة فوق البيانات'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
