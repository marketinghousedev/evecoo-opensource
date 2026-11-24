import { getPublicCard } from '@/lib/card';
import { json, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route<{ businessId: string }>((_req, { businessId }) => json(getPublicCard(businessId)));
