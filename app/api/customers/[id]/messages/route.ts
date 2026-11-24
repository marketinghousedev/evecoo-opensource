import { json, route } from '@/lib/http';
import { listCustomerMessages } from '@/lib/messages';

export const dynamic = 'force-dynamic';

export const GET = route<{ id: string }>(async (_req, { id }) => json(listCustomerMessages(id)));
