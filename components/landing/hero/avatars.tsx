/* Hero flow people: illustrated avatars from public/illustrations/avatars (docs/ILLUSTRATION-SYSTEM.md).
   Client component, so each asset is a named import and only these ship. */
import { IlloSvg } from '@/components/illustration/IlloSvg';
import {
  avatarsAvatar01, avatarsAvatar02, avatarsAvatar04, avatarsAvatar05, avatarsAvatar06, avatarsAvatar09,
  avatarsGuestGrey, avatarsBadgeCheck, avatarsBadgePerson,
} from '@/components/illustration/illo-data';

/** Six faces, mixed ages, skin tones and styles (hijab, curls, bald, beard, glasses). */
const FACES = [avatarsAvatar01, avatarsAvatar02, avatarsAvatar06, avatarsAvatar04, avatarsAvatar09, avatarsAvatar05];

export function Avatar({ i }: { i: number }) {
  return <IlloSvg data={FACES[i % FACES.length]} className="hf-art" />;
}

/** The anonymous guest: same silhouette as the avatars so it can morph into one at the beam. */
export function PersonGlyph() {
  return <IlloSvg data={avatarsGuestGrey} className="hf-art" />;
}

export function AvatarBadge({ kind }: { kind: 'check' | 'person' }) {
  return <IlloSvg data={kind === 'person' ? avatarsBadgePerson : avatarsBadgeCheck} className="hf-badge-art" />;
}
