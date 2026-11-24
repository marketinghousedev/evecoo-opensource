import { getDb } from './db';
import { ApiError } from './http';
import type { Card, PublicCard } from './types';

export function getPublicCard(businessId: string): PublicCard {
  const r = getDb()
    .prepare(
      'SELECT id, name, card_name AS cardName, card_reward AS reward, stamps_required AS stampsRequired, card_color AS color FROM businesses WHERE id = ?',
    )
    .get(businessId) as
    | { id: string; name: string; cardName: string; reward: string; stampsRequired: number; color: string }
    | undefined;
  if (!r) throw new ApiError(404, 'not_found', 'errors.notFound');
  return {
    businessId: r.id,
    businessName: r.name,
    name: r.cardName,
    reward: r.reward,
    stampsRequired: r.stampsRequired,
    color: r.color,
  };
}

export function updateCard(businessId: string, c: Card): Card {
  const res = getDb()
    .prepare('UPDATE businesses SET card_name = ?, card_reward = ?, stamps_required = ?, card_color = ? WHERE id = ?')
    .run(c.name, c.reward, c.stampsRequired, c.color, businessId);
  if (Number(res.changes) === 0) throw new ApiError(404, 'not_found', 'errors.notFound');
  const p = getPublicCard(businessId);
  return { name: p.name, reward: p.reward, stampsRequired: p.stampsRequired, color: p.color };
}

export function getCard(businessId: string): Card {
  const p = getPublicCard(businessId);
  return { name: p.name, reward: p.reward, stampsRequired: p.stampsRequired, color: p.color };
}
