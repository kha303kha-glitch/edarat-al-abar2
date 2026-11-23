import React, {useState} from 'react';
import {Database, Download, Plus, WifiOff, X} from 'lucide-react';
import {useOnlineStatus} from '../hooks/useOnlineStatus';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface TopBarProps {
  onGoHome: () => void;
  onOpenBackup: () => void;
  onAddClient: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onGoHome,
  onOpenBackup,
  onAddClient,
}) => {
  const isOnline = useOnlineStatus();
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <>
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 h-14 sm:h-16">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={onGoHome}
            className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-[#0F3D6E] whitespace-nowrap shrink-0 hover:opacity-85 transition-opacity"
          >
            إدارة الآبار
          </button>

          {/* Zone 2: Concise Navigation & Utilities */}
          <nav className="flex items-center gap-2 sm:gap-5 text-sm font-medium text-slate-700">
            <button
              type="button"
              onClick={onGoHome}
              className="min-h-[40px] px-2 hover:text-[#0F3D6E] transition-colors whitespace-nowrap shrink-0"
            >
              العملاء
            </button>
            <button
              type="button"
              onClick={onOpenBackup}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-2.5 rounded-lg hover:bg-slate-100 hover:text-[#0F3D6E] transition-colors whitespace-nowrap shrink-0"
            >
              <Database className="h-4 w-4 text-[#0F3D6E]" />
              <span className="hidden xs:inline sm:inline">النسخ الاحتياطي</span>
            </button>

            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={install}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 text-xs font-semibold text-[#0F3D6E] hover:bg-sky-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>تثبيت التطبيق</span>
              </button>
            )}

            {!isInstalled && !isInstallable && isIOS && (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="min-h-[40px] inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 text-xs font-semibold text-[#0F3D6E] hover:bg-sky-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>تثبيت</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="hidden sm:flex items-center shrink-0">
            <button
              type="button"
              onClick={onAddClient}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#0F3D6E] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#0B2E54] transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>عميل جديد</span>
            </button>
          </div>
        </div>
      </header>

      {!isOnline && (
        <div className="no-print fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-lg">
          <WifiOff className="h-3.5 w-3.5 text-amber-400" />
          <span>وضع عدم الاتصال — يتم الحفظ محلياً</span>
        </div>
      )}

      {showIOSGuide && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">
                تثبيت التطبيق على iPhone / iPad
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="إغلاق"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              1. اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح Safari.
              <br />
              2. اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-[#0F3D6E] py-2 text-sm font-semibold text-white"
            >
              فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};
