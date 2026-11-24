export type Role = 'owner' | 'staff';
export type SessionUser = { id: string; email: string; role: Role; businessId: string; businessName: string };
export type Card = { name: string; reward: string; stampsRequired: number; color: string };
export type PublicCard = Card & { businessId: string; businessName: string };
export type StampResult = { stamps: number; redeemable: boolean };
export type CustomerView = {
  customerId: string;
  name: string;
  stamps: number;
  stampsRequired: number;
  redeemable: boolean;
  reward: string;
  businessName: string;
  cardName: string;
  color: string;
};
export type PassJson = {
  platform: 'apple' | 'google';
  serialNumber: string;
  stamps: number;
  stampsRequired: number;
  reward: string;
  businessName: string;
  customerName: string;
  cardName: string;
  color: string;
  redeemable: boolean;
  barcode: { format: 'QR'; message: string };
};
export type MessageKind = 'broadcast' | 'winback' | 'birthday' | 'welcome';
export type MessageSummary = {
  id: string;
  title: string;
  body: string;
  kind: MessageKind;
  recipients: number;
  createdAt: string;
};
export type CustomerMessage = { id: string; title: string; body: string; kind: MessageKind; createdAt: string };
export type Stats = {
  customers: number;
  returning: number;
  returningPercent: number;
  visitsByHour: number[];
  visitsByWeekday: number[];
};
