import type { User } from "@/types/user";

export function computePurchasedTokenAmount(refreshedUser: User, previousBalance: number): number {
  const balanceDelta = Math.max((refreshedUser.balance ?? previousBalance) - previousBalance, 0);
  const latestPositiveHistory = refreshedUser.history?.find((entry) => entry.value > 0)?.value ?? 0;
  return balanceDelta > 0 ? balanceDelta : latestPositiveHistory;
}

export interface PaymentSuccessRefreshMessages {
  reloadSuccess: (values: { chars: number }) => string;
  reloadSuccessUnknown: () => string;
  reloadPending: () => string;
}

export interface PaymentSuccessRefreshToast {
  success: (message: string) => void;
  info: (message: string) => void;
}

export async function refreshUserAfterPaymentSuccess(options: {
  refreshUser: () => Promise<User>;
  previousBalance: number;
  toast: PaymentSuccessRefreshToast;
  messages: PaymentSuccessRefreshMessages;
}): Promise<User | null> {
  const { refreshUser, previousBalance, toast, messages } = options;

  try {
    const refreshedUser = await refreshUser();
    const charsAdded = computePurchasedTokenAmount(refreshedUser, previousBalance);

    if (charsAdded > 0) {
      toast.success(messages.reloadSuccess({ chars: charsAdded }));
    } else {
      toast.success(messages.reloadSuccessUnknown());
    }

    return refreshedUser;
  } catch {
    toast.info(messages.reloadPending());
    return null;
  }
}
