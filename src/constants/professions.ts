import { professions as sharedProfessions } from '@cashflow/shared'
import type { Profession } from '@/types/profession'

/**
 * UI-flavor fields that don't live in the shared package — display copy,
 * difficulty rating, and the legacy `bankLoan` aggregate the dashboard
 * preview shows on setup. Keyed by the same lowercase profession id the
 * shared `professions` map uses, so any future profession the backend adds
 * just needs an entry here to surface in the UI.
 *
 * Financial values (salary, taxes, mortgage, schoolLoan, carLoan,
 * creditCard, otherExpenses, perChildExpense) are pulled directly from
 * `@cashflow/shared` — keeping the two sources in sync was the single
 * largest drift surface in the frontend; the adapter eliminates it.
 */
const UI_FLAVOR: Record<
  string,
  Pick<Profession, 'description' | 'difficulty' | 'bankLoan'>
> = {
  janitor: {
    description: 'Building maintenance professional with stable income',
    difficulty: 'easy',
    bankLoan: 700,
  },
  secretary: {
    description: 'Administrative professional with organizational expertise',
    difficulty: 'easy',
    bankLoan: 930,
  },
  truck_driver: {
    description: 'Transportation professional on the open road',
    difficulty: 'easy',
    bankLoan: 930,
  },
  mechanic: {
    description: 'Skilled technician keeping vehicles running',
    difficulty: 'easy',
    bankLoan: 770,
  },
  police_officer: {
    description: 'Law enforcement professional serving the community',
    difficulty: 'medium',
    bankLoan: 1170,
  },
  nurse: {
    description: 'Healthcare professional caring for patients',
    difficulty: 'medium',
    bankLoan: 1170,
  },
  teacher: {
    description: 'Educator shaping young minds',
    difficulty: 'medium',
    bankLoan: 1160,
  },
  engineer: {
    description: 'Technical professional solving complex problems',
    difficulty: 'medium',
    bankLoan: 1740,
  },
  business_manager: {
    description: 'Corporate professional managing teams',
    difficulty: 'medium',
    bankLoan: 1720,
  },
  airline_pilot: {
    description: 'Aviation professional flying the skies',
    difficulty: 'hard',
    bankLoan: 2650,
  },
  lawyer: {
    description: 'Legal professional advocating for clients',
    difficulty: 'hard',
    bankLoan: 2130,
  },
  doctor: {
    description: 'Medical professional healing patients',
    difficulty: 'hard',
    bankLoan: 3600,
  },
}

// Map shared profession data → frontend Profession shape, merging UI-only
// fields from the local lookup. Any profession the backend adds without a
// matching UI_FLAVOR entry falls back to default copy.
export const PROFESSIONS: Profession[] = Object.entries(sharedProfessions).map(
  ([id, data]) => {
    const flavor = UI_FLAVOR[id] ?? {
      description: data.name,
      difficulty: 'medium' as const,
      bankLoan: 0,
    }
    return {
      id,
      title: data.name,
      salary: data.salary,
      taxes: data.taxes,
      mortgage: data.mortgage,
      schoolLoan: data.schoolLoan,
      carLoan: data.carLoan,
      creditCard: data.creditCard,
      otherExpenses: data.otherExpenses,
      perChildExpense: data.childExpensePerChild,
      bankLoan: flavor.bankLoan,
      description: flavor.description,
      difficulty: flavor.difficulty,
      // Pass-through fields from shared
      name: data.name,
      savings: data.savings,
      retailPayment: data.retailPayment,
      childExpensePerChild: data.childExpensePerChild,
      liabilities: data.liabilities,
    }
  },
)
