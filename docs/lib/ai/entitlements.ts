type Entitlements = {
  maxMessagesPerDay: number;
};

export const entitlementsByUserType: Record<string, Entitlements> = {
  guest: {
    maxMessagesPerDay: 20,
  },
  regular: {
    maxMessagesPerDay: 50,
  },
};
