import { useTranslation } from 'react-i18next';
import { Apple, Beef, Bean, Candy, Citrus, Egg, Leaf, Milk, Sparkles, Wheat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Disclaimer } from '@/components/ui/Disclaimer';

const FOODS: Array<[string, LucideIcon]> = [
  ['ragi', Wheat],
  ['greens', Leaf],
  ['jaggery', Candy],
  ['lentils', Bean],
  ['dates', Apple],
  ['sesame', Sparkles],
  ['eggs', Egg],
  ['meat', Beef],
  ['citrus', Citrus],
  ['dairy', Milk],
];

/** Local, affordable foods that help hemoglobin, with the vitamin C pairing tip. */
export function DietTipsPage() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t('guidance:diet.title')} subtitle={t('guidance:diet.intro')} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FOODS.map(([k, Icon]) => (
          <Card key={k} className="flex items-start gap-4 !p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-light text-secondary">
              <Icon size={24} aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold">{t(`guidance:diet.foods.${k}.name`)}</h2>
              <p className="text-ink-muted">{t(`guidance:diet.foods.${k}.note`)}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card tone="primary" className="mt-6">
        <h2 className="flex items-center gap-2 text-h3 text-primary">
          <Citrus aria-hidden /> {t('guidance:diet.pairingTitle')}
        </h2>
        <p className="mt-2 text-lg">{t('guidance:diet.pairing')}</p>
      </Card>
      <Card className="mt-4">
        <h2 className="text-h3">{t('guidance:actions.avoidTeaWithMeals.title')}</h2>
        <p className="mt-1 text-ink-muted">{t('guidance:actions.avoidTeaWithMeals.body')}</p>
        <h2 className="mt-4 text-h3">{t('guidance:actions.ironCookware.title')}</h2>
        <p className="mt-1 text-ink-muted">{t('guidance:actions.ironCookware.body')}</p>
        <h2 className="mt-4 text-h3">{t('guidance:actions.deworming.title')}</h2>
        <p className="mt-1 text-ink-muted">{t('guidance:actions.deworming.body')}</p>
      </Card>
      <Disclaimer className="mt-6" compact />
    </div>
  );
}
