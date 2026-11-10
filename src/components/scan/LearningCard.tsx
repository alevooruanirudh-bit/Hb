import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { scanRepo } from '@/db/repositories';
import { fitDeviceModel } from '@/ml/deviceLearning';
import { deviceLearningConfig } from '@/config/pipelineConfig';
import { isLearningScan, toPair } from '@/features/learning/learningData';
import { learningExportBlob } from '@/features/learning/learningExport';
import { shareOrDownloadFile } from '@/utils/shareFile';

/** Settings → "Learning from blood tests": progress, measured improvement, anonymous export. */
export function LearningCard() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string | null>(null);
  const model = useLiveQuery(async () => fitDeviceModel((await scanRepo.withBloodTests()).filter(isLearningScan).map(toPair)));
  if (!model) return null;

  const need = Math.max(0, deviceLearningConfig.minPairs - model.pairs);
  const exportData = async () => {
    const { blob, count } = await learningExportBlob();
    if (!count) return setStatus(t('learning.exportEmpty'));
    await shareOrDownloadFile(blob, `HemoScan_learning_${new Date().toISOString().slice(0, 10)}.json`, t('learning.exportTitle'));
    setStatus(t('learning.exported', { n: count }));
  };

  return (
    <Card>
      <h2 className="flex items-center gap-2 text-h3">
        <GraduationCap className="text-primary" size={22} aria-hidden />
        {t('learning.title')}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">{t('learning.intro')}</p>
      <p className="mt-3 font-semibold" role="status">
        {t('learning.count', { n: model.pairs, people: model.people })}
      </p>
      <p className="mt-1 text-sm">
        {model.active
          ? t('learning.active', { before: model.maeBefore!.toFixed(1), after: model.maeAfter!.toFixed(1) })
          : model.reason === 'fewPairs'
            ? t('learning.needMore', { n: need })
            : model.reason === 'fewPeople'
              ? t('learning.needPeople')
              : t('learning.noImprovement', { before: model.maeBefore?.toFixed(1), after: model.maeAfter?.toFixed(1) })}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button size="md" variant="outline" icon={Download} onClick={exportData}>
          {t('learning.export')}
        </Button>
        {status && <p className="text-sm">{status}</p>}
      </div>
      <p className="mt-2 text-xs text-ink-muted">{t('learning.exportHelp')}</p>
    </Card>
  );
}
