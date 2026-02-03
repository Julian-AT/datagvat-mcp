type Entitlements = {
  maxMessagesPerDay: number;
};

export const entitlementsByUserType: Record<string, Entitlements> = {
  guest: {
    maxMessagesPerDay: 100,
  },
  regular: {
    maxMessagesPerDay: 100,
  },
};
