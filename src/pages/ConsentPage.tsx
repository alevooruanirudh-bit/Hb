import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, HardDrive, ImageOff, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSettings } from '@/store/settingsStore';
import { db } from '@/db/db';
import { cn } from '@/utils/cn';

/** Plain-language consent for storing results on this device. */
export function ConsentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const set = useSettings((s) => s.set);
  const [agreed, setAgreed] = useState(false);

  const points = [
    { icon: HardDrive, key: 'consent.point1' },
    { icon: ImageOff, key: 'consent.point2' },
    { icon: ShieldCheck, key: 'consent.point3' },
    { icon: Trash2, key: 'consent.point4' },
  ];

  const accept = async () => {
    set({ consentGiven: true });
    const count = await db.profiles.count();
    navigate(count === 0 ? '/profile/new' : '/home', { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-10">
      <h1>{t('consent.title')}</h1>
      <p className="mt-2 text-lg text-ink-muted">{t('consent.intro')}</p>

      <Card className="mt-6 space-y-5">
        {points.map(({ icon: Icon, key }) => (
          <div key={key} className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-light text-secondary">
              <Icon size={22} aria-hidden />
            </span>
            <p className="pt-2">{t(key)}</p>
          </div>
        ))}
      </Card>

      <label className="mt-6 flex min-h-[56px] cursor-pointer items-center gap-4 rounded-2xl bg-surface p-4 shadow-soft">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 transition peer-focus-visible:ring-4 peer-focus-visible:ring-primary/40',
            agreed ? 'border-primary bg-primary text-primary-on' : 'border-ink-muted',
          )}
          aria-hidden
        >
          {agreed && <Check size={20} strokeWidth={3} />}
        </span>
        <span className="font-semibold">{t('consent.checkbox')}</span>
      </label>

      <div className="mt-auto pt-8">
        <Button fullWidth icon={Check} disabled={!agreed} onClick={accept}>
          {t('consent.agree')}
        </Button>
      </div>
    </div>
  );
}
