import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Pencil, UserPlus, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useProfiles } from '@/store/useActiveProfile';
import { useSettings } from '@/store/settingsStore';
import { profileLabel, profileSummary } from '@/utils/profileText';
import { cn } from '@/utils/cn';

/** Manage profiles: switch the active person, edit or add. */
export function ProfilesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profiles, active } = useProfiles();
  const set = useSettings((s) => s.set);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('profile.manage')} subtitle={t('profile.manageSubtitle')} back />
      <div className="space-y-3">
        {profiles?.map((p, i) => {
          const isActive = p.id === active?.id;
          return (
            <Card
              key={p.id}
              className={cn('flex items-center gap-4 !p-4', isActive && 'ring-2 ring-primary/50')}
            >
              <button
                type="button"
                className="flex min-h-touch flex-1 items-center gap-4 text-left"
                onClick={() => set({ activeProfileId: p.id! })}
                aria-pressed={isActive}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
                  <UserRound size={24} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-semibold">{profileLabel(p, i, t)}</span>
                  <span className="block text-ink-muted">{profileSummary(p, t)}</span>
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                    <CheckCircle2 size={18} aria-hidden /> {t('profile.active')}
                  </span>
                )}
              </button>
              <Button
                variant="ghost"
                size="md"
                icon={Pencil}
                onClick={() => navigate(`/profile/${p.id}`)}
                aria-label={t('common.edit')}
              />
            </Card>
          );
        })}
      </div>
      <Button
        className="mt-6"
        fullWidth
        variant="outline"
        icon={UserPlus}
        onClick={() => navigate('/profile/new')}
      >
        {t('profile.add')}
      </Button>
    </div>
  );
}
