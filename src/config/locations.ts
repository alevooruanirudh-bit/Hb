/**
 * Location data for the profile form. Location is used for the WHO altitude
 * adjustment (people living high up have naturally higher hemoglobin) and to
 * show local health resources — never to guess ethnicity.
 */

/** ISO 3166-1 alpha-2 codes; names are localized at runtime with Intl.DisplayNames. */
export const COUNTRY_CODES = (
  'IN,BD,NP,LK,PK,BT,MV,AF,AE,AG,AL,AM,AO,AR,AT,AU,AZ,BA,BB,BE,BF,BG,BH,BI,BJ,BN,BO,BR,BS,BW,BY,BZ,CA,CD,CF,CG,CH,CI,CL,CM,CN,CO,CR,CU,CV,CY,CZ,DE,DJ,DK,DM,DO,DZ,EC,EE,EG,ER,ES,ET,FI,FJ,FR,GA,GB,GD,GE,GH,GM,GN,GQ,GR,GT,GW,GY,HK,HN,HR,HT,HU,ID,IE,IL,IQ,IR,IS,IT,JM,JO,JP,KE,KG,KH,KI,KM,KN,KR,KW,KZ,LA,LB,LC,LI,LR,LS,LT,LU,LV,LY,MA,MC,MD,ME,MG,MK,ML,MM,MN,MR,MT,MU,MW,MX,MY,MZ,NA,NE,NG,NI,NL,NO,NZ,OM,PA,PE,PG,PH,PL,PT,PY,QA,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SI,SK,SL,SN,SO,SR,SS,ST,SV,SY,SZ,TD,TG,TH,TJ,TL,TM,TN,TO,TR,TT,TW,TZ,UA,UG,US,UY,UZ,VC,VE,VN,VU,WS,YE,ZA,ZM,ZW'
).split(',');

/** Countries shown first (South Asia). */
export const PRIORITY_COUNTRIES = ['IN', 'BD', 'NP', 'LK', 'PK', 'BT'];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

/**
 * States/UTs with many people living above 1000 m — the form prompts for the
 * altitude there. Ladakh is almost entirely above 3000 m, so it gets a default.
 */
export const HILL_STATES: Record<string, number | null> = {
  Ladakh: 3500,
  Sikkim: null,
  'Himachal Pradesh': null,
  Uttarakhand: null,
  'Jammu and Kashmir': null,
  'Arunachal Pradesh': null,
  Meghalaya: null,
  Mizoram: null,
  Nagaland: null,
  Manipur: null,
};

export function countryName(code: string, lang: string): string {
  try {
    return new Intl.DisplayNames([lang, 'en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
