import type { QuestionAnswer, QuestionId } from '@/db/db';
import type { ClassificationSubject, Severity } from '@/ml/types';

/** Keys into the localized guidance content (`src/i18n/locales/<lng>/guidance.json`). */
export type CauseId =
  | 'ironDeficiency'
  | 'lowIronDiet'
  | 'poorAbsorption'
  | 'b12Folate'
  | 'menstrualLoss'
  | 'bloodLoss'
  | 'worms'
  | 'pregnancyDemand'
  | 'otherConditions';

export type ActionId =
  | 'keepHealthyDiet'
  | 'recheckYearly'
  | 'ironRichFoods'
  | 'vitaminC'
  | 'avoidTeaWithMeals'
  | 'deworming'
  | 'b12Foods'
  | 'ifaTablets'
  | 'ironCookware'
  | 'pregnancyCare'
  | 'restAndSafety'
  | 'confirmBloodTest';

/** How strongly to recommend seeing a health professional. */
export type Referral = 'none' | 'routine' | 'soon' | 'urgent';

export interface GuidancePlan {
  severity: Severity;
  referral: Referral;
  /** Ordered most-likely first. Phrased as possibilities, never a diagnosis. */
  causes: CauseId[];
  actions: ActionId[];
  /** Show Anemia Mukt Bharat / PHC / Anganwadi resources. */
  showResources: boolean;
  /** Symptoms that deserve a warning (dizziness etc. with anemia). */
  symptomWarning: boolean;
}

export type Answers = Partial<Record<QuestionId, QuestionAnswer>>;

const REFERRAL_ORDER: Referral[] = ['none', 'routine', 'soon', 'urgent'];
const atLeast = (a: Referral, b: Referral): Referral =>
  REFERRAL_ORDER.indexOf(a) >= REFERRAL_ORDER.indexOf(b) ? a : b;

/**
 * Rule-based guidance: combines WHO severity with questionnaire answers to
 * produce localized cause / action / referral keys. All user-facing text lives
 * in the locale JSON files — this class only decides WHICH content to show.
 */
export class GuidanceEngine {
  build(
    severity: Severity,
    answers: Answers,
    subject?: Pick<ClassificationSubject, 'sex' | 'pregnant' | 'ageYears'>,
  ): GuidancePlan {
    const yes = (q: QuestionId) => answers[q] === 'yes';
    const pregnant = yes('pregnant') || !!subject?.pregnant;

    if (severity === 'normal') {
      return {
        severity,
        referral: 'none',
        causes: [],
        actions: ['keepHealthyDiet', ...(pregnant ? (['pregnancyCare'] as ActionId[]) : []), 'recheckYearly'],
        showResources: pregnant,
        symptomWarning: false,
      };
    }

    // Referral level
    let referral: Referral = severity === 'mild' ? 'routine' : severity === 'moderate' ? 'soon' : 'urgent';
    if (yes('bloodLoss')) referral = atLeast(referral, 'soon');
    if (pregnant) referral = atLeast(referral, 'soon');
    const symptomWarning = (yes('dizzy') || yes('tired')) && severity !== 'mild';
    if (yes('dizzy') && severity === 'moderate') referral = atLeast(referral, 'soon');

    // Possible causes, most common first (iron deficiency is the leading cause in India)
    const causes: CauseId[] = ['ironDeficiency'];
    if (yes('bloodLoss')) causes.unshift('bloodLoss');
    if (yes('heavyPeriods')) causes.push('menstrualLoss');
    if (pregnant) causes.push('pregnancyDemand');
    if (yes('vegetarian')) causes.push('lowIronDiet', 'b12Folate');
    if (yes('teaWithMeals')) causes.push('poorAbsorption');
    if (yes('noRecentDeworming')) causes.push('worms');
    if (!causes.includes('b12Folate')) causes.push('b12Folate');
    if (severity === 'moderate' || severity === 'severe') causes.push('otherConditions');

    // What you can do
    const actions: ActionId[] = [];
    if (severity === 'severe') actions.push('confirmBloodTest');
    if (yes('teaWithMeals')) actions.push('avoidTeaWithMeals');
    actions.push('ironRichFoods', 'vitaminC');
    if (yes('vegetarian')) actions.push('b12Foods');
    if (!yes('teaWithMeals')) actions.push('avoidTeaWithMeals');
    if (answers.noRecentDeworming !== 'no') actions.push('deworming');
    actions.push('ifaTablets', 'ironCookware');
    if (pregnant) actions.push('pregnancyCare');
    if (yes('dizzy') || yes('tired')) actions.push('restAndSafety');
    if (severity !== 'severe') actions.push('confirmBloodTest');

    return {
      severity,
      referral,
      causes: [...new Set(causes)],
      actions: [...new Set(actions)],
      showResources: true,
      symptomWarning,
    };
  }
}

export const guidanceEngine = new GuidanceEngine();
