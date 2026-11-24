import { json, route } from '@/lib/http';
import { buildPass } from '@/lib/pass';

export const dynamic = 'force-dynamic';

export const GET = route<{ customerId: string }>((_req, { customerId }) => json(buildPass(customerId, 'apple')));
