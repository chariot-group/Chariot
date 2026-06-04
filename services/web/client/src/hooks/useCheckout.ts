import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import paymentService, { ResolvedCode, StripeProduct } from "@/services/PaymentService";
import { computeDiscountedAmount } from "@/lib/checkout-utils";
import type { PromoCodeState } from "@/components/checkout/CheckoutForm";
import referralService from "@/services/ReferralService";

export type ReferralDiscount = {
    discountPercent: number;
    discountType: 'referee' | 'referrer';
};

interface UseCheckoutReturn {
    locale: string;
    packId: string;
    // Product
    product: StripeProduct | null;
    productLoading: boolean;
    productError: boolean;
    // PaymentIntent
    clientSecret: string | null;
    piRefreshing: boolean;
    piError: string | null;
    // Pricing
    pricing: {
        originalAmount: number;
        discountedAmount: number;
        discountAmount: number;
        currency: string;
    };
    tokenCount: number | null;
    // Quantity
    quantity: number;
    onQuantityChange: (quantity: number) => void;
    // Promo code
    promoCode: PromoCodeState;
    // Referral discount (auto-applied when no manual code)
    referralDiscount: ReferralDiscount | null;
}

export function useCheckout(): UseCheckoutReturn {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const t = useTranslations("checkout");
    const tShop = useTranslations("shop");

    const locale = pathname.split("/")[1] || "fr";
    const packId = searchParams.get("packId") ?? "";
    const displayName = searchParams.get("displayName") ?? "";

    // Product
    const [product, setProduct] = useState<StripeProduct | null>(null);
    const [productLoading, setProductLoading] = useState(true);
    const [productError, setProductError] = useState(false);

    // Promo code
    const [codeInput, setCodeInput] = useState("");
    const [codeLoading, setCodeLoading] = useState(false);
    const [appliedCode, setAppliedCode] = useState<{ raw: string; resolved: ResolvedCode } | null>(null);
    const [codeError, setCodeError] = useState<string | null>(null);
    const codeInputRef = useRef<HTMLInputElement>(null);

    // Quantity
    const [quantity, setQuantity] = useState(1);

    // Referral discount
    const [referralDiscount, setReferralDiscount] = useState<ReferralDiscount | null>(null);

    // PaymentIntent
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [piRefreshing, setPiRefreshing] = useState(false);
    const [piError, setPiError] = useState<string | null>(null);

    // ── Load product ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!packId) {
            setProductError(true);
            setProductLoading(false);
            return;
        }
        let cancelled = false;
        paymentService
            .getProducts()
            .then((products) => {
                if (cancelled) return;
                const found = products.find((p) => p.id === packId) ?? null;
                if (!found) setProductError(true);
                else setProduct(found);
            })
            .catch(() => {
                if (!cancelled) setProductError(true);
            })
            .finally(() => {
                if (!cancelled) setProductLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [packId]);

    // ── Create initial PaymentIntent (once, on product load) ──────────────────
    const createInitialPaymentIntent = useCallback(
        async () => {
            if (!product) return;
            setPiRefreshing(true);
            setPiError(null);
            try {
                const result = await paymentService.createPaymentIntent(
                    packId,
                    displayName || product.name,
                );
                setClientSecret(result.clientSecret);
                setPaymentIntentId(result.paymentIntentId);
            } catch {
                setPiError(t("payError"));
            } finally {
                setPiRefreshing(false);
            }
        },
        [packId, displayName, product, t],
    );

    // ── Update existing PaymentIntent amount (quantity / promo changes) ────────
    const updatePaymentIntentAmount = useCallback(
        async (promoCode?: string, affiliationCode?: string, qty?: number) => {
            if (!paymentIntentId) return;
            setPiRefreshing(true);
            setPiError(null);
            try {
                await paymentService.updatePaymentIntent(
                    paymentIntentId,
                    qty,
                    promoCode,
                    affiliationCode,
                );
            } catch {
                setPiError(t("payError"));
            } finally {
                setPiRefreshing(false);
            }
        },
        [paymentIntentId, t],
    );

    useEffect(() => {
        if (product) void createInitialPaymentIntent();
    }, [product, createInitialPaymentIntent]);

    // ── Fetch referral discount (auto-applied when no manual code) ─────────────
    useEffect(() => {
        referralService.getMyReferral().then((info) => {
            const refereePercent = info.myRefereeDiscount?.available ? info.myRefereeDiscount.discountPercent : 0;
            const referrerPercent = info.currentDiscountPercent;
            if (refereePercent === 0 && referrerPercent === 0) {
                setReferralDiscount(null);
                return;
            }
            const bestPercent = Math.max(refereePercent, referrerPercent);
            const discountType: 'referee' | 'referrer' = refereePercent >= referrerPercent ? 'referee' : 'referrer';
            setReferralDiscount({ discountPercent: bestPercent, discountType });
        }).catch(() => {
            setReferralDiscount(null);
        });
    }, []);

    // ── Promo code handlers ─────────────────────────────────────────────────────
    const handleApplyCode = useCallback(async () => {
        const trimmed = codeInput.trim().toUpperCase();
        if (!trimmed) return;

        setCodeLoading(true);
        setCodeError(null);

        let resolved: ResolvedCode;
        try {
            resolved = await paymentService.resolveCode(trimmed);
        } catch {
            setCodeError(tShop("codeNotFound"));
            setCodeLoading(false);
            return;
        }

        const promoCode = resolved.type === "promo" ? trimmed : undefined;
        const affiliationCode = resolved.type === "affiliation" ? trimmed : undefined;

        setAppliedCode({ raw: trimmed, resolved });
        setCodeInput("");
        setCodeLoading(false);

        void updatePaymentIntentAmount(promoCode, affiliationCode, quantity);
    }, [codeInput, quantity, updatePaymentIntentAmount, tShop]);

    const handleRemoveCode = useCallback(() => {
        setAppliedCode(null);
        setCodeError(null);
        void updatePaymentIntentAmount(undefined, undefined, quantity);
        setTimeout(() => codeInputRef.current?.focus(), 50);
    }, [updatePaymentIntentAmount, quantity]);

    // ── Pricing ─────────────────────────────────────────────────────────────────
    const price = product?.prices[0];
    const originalAmount = price?.unit_amount ?? 0;
    let discountedAmount = originalAmount;
    if (originalAmount > 0) {
        if (appliedCode) {
            discountedAmount = computeDiscountedAmount(originalAmount, appliedCode.resolved);
        } else if (referralDiscount) {
            discountedAmount = Math.max(0, originalAmount - Math.floor((originalAmount * referralDiscount.discountPercent) / 100));
        }
    }
    const discountAmount = originalAmount - discountedAmount;
    const tokenCount = product?.metadata?.token_number ? parseInt(product.metadata.token_number, 10) : null;

    const handleQuantityChange = useCallback((newQuantity: number) => {
        const clamped = Math.max(1, Math.min(10, newQuantity));
        setQuantity(clamped);
        const currentApplied = appliedCode;
        const promoArg = currentApplied?.resolved.type === "promo" ? currentApplied.raw : undefined;
        const affiliationArg = currentApplied?.resolved.type === "affiliation" ? currentApplied.raw : undefined;
        void updatePaymentIntentAmount(promoArg, affiliationArg, clamped);
    }, [appliedCode, updatePaymentIntentAmount]);

    return {
        locale,
        packId,
        product,
        productLoading,
        productError,
        clientSecret,
        piRefreshing,
        piError,
        pricing: {
            originalAmount,
            discountedAmount,
            discountAmount,
            currency: price?.currency ?? "eur",
        },
        tokenCount,
        quantity,
        onQuantityChange: handleQuantityChange,
        referralDiscount,
        promoCode: {
            input: codeInput,
            loading: codeLoading,
            error: codeError,
            applied: appliedCode,
            inputRef: codeInputRef,
            onChange: (v) => {
                setCodeInput(v);
                setCodeError(null);
            },
            onApply: handleApplyCode,
            onRemove: handleRemoveCode,
        },
    };
}
