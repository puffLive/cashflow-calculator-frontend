/**
 * Real-estate properties available to buy in Cashflow 101, sourced from the
 * canonical Assets sheet. The backend doesn't validate the property name, so
 * this list is display-only — the wizard sends the resolved label as
 * `propertyName`. Each option's `label` is what we send AND what users see.
 *
 * The "Apartment" entries differ only by unit count, so the labels embed the
 * unit count to keep them uniquely selectable.
 */
export interface RealEstateOption {
  /** The human-readable label, also sent to the backend as `propertyName`. */
  label: string
  /** Number of rentable units — informational, useful in the dropdown UI. */
  units: number
}

export const AVAILABLE_REAL_ESTATE: RealEstateOption[] = [
  { label: 'Condo - 2Br/1Ba', units: 1 },
  { label: 'House - 3Br/2Ba', units: 1 },
  { label: 'Duplex', units: 2 },
  { label: '4-Plex', units: 4 },
  { label: '8-Plex', units: 8 },
  { label: 'Apartment - 12 units', units: 12 },
  { label: 'Apartment - 24 units', units: 24 },
  { label: 'Apartment - 60 units', units: 60 },
]
