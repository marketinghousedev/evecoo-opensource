// Ten fictional wordmarks for the "Trusted by" strip. Named imports so only these ship.
import {
  brandsWordmarkKiezkaffee, brandsWordmarkNordbrot, brandsWordmarkKlingenclub, brandsWordmarkGlutundteig,
  brandsWordmarkStapelbar, brandsWordmarkLackstudio, brandsWordmarkEislabor, brandsWordmarkSafteck,
  brandsWordmarkBluetenstand, brandsWordmarkSpiessrei,
} from '@/components/illustration/illo-data';
import type { IlloData } from '@/components/illustration/types';

/** [asset, i18n key suffix used as the accessible name]. */
export const WORDMARKS: readonly (readonly [IlloData, string])[] = [
  [brandsWordmarkKiezkaffee, 'l1'], [brandsWordmarkNordbrot, 'l2'], [brandsWordmarkKlingenclub, 'l3'],
  [brandsWordmarkGlutundteig, 'l4'], [brandsWordmarkStapelbar, 'l5'], [brandsWordmarkLackstudio, 'l6'],
  [brandsWordmarkEislabor, 'l7'], [brandsWordmarkSafteck, 'l8'], [brandsWordmarkBluetenstand, 'l9'],
  [brandsWordmarkSpiessrei, 'l10'],
];
