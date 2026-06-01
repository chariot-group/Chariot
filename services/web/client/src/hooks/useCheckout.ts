import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import paymentService, { ResolvedCode, StripeProduct } from "@/services/PaymentService";
import { computeDiscountedAmount } from "@/lib/checkout-utils";
import type { PromoCodeState } from "@/components/checkout/CheckoutForm";

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
    // Promo code
    promoCode: PromoCodeState;
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

    // PaymentIntent
    const [clientSecret, setClientSecret] = useState<string | null>(null);
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

    // ── Create / refresh PaymentIntent ─────────────────────────────────────────
    const refreshPaymentIntent = useCallback(
        async (promoCode?: string, affiliationCode?: string) => {
            if (!product) return;
            setPiRefreshing(true);
            setPiError(null);
            try {
                const result = await paymentService.createPaymentIntent(
                    packId,
                    displayName || product.name,
                    promoCode,
                    affiliationCode,
                );
                setClientSecret(result.clientSecret);
            } catch {
                setPiError(t("payError"));
            } finally {
                setPiRefreshing(false);
            }
        },
        [packId, displayName, product, t],
    );

    useEffect(() => {
        if (product) void refreshPaymentIntent();
    }, [product, refreshPaymentIntent]);

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

        void refreshPaymentIntent(promoCode, affiliationCode);
    }, [codeInput, refreshPaymentIntent, tShop]);

    const handleRemoveCode = useCallback(() => {
        setAppliedCode(null);
        setCodeError(null);
        void refreshPaymentIntent();
        setTimeout(() => codeInputRef.current?.focus(), 50);
    }, [refreshPaymentIntent]);

    // ── Pricing ─────────────────────────────────────────────────────────────────
    const price = product?.prices[0];
    const originalAmount = price?.unit_amount ?? 0;
    const discountedAmount =
        appliedCode && originalAmount > 0 ? computeDiscountedAmount(originalAmount, appliedCode.resolved) : originalAmount;
    const discountAmount = originalAmount - discountedAmount;
    const tokenCount = product?.metadata?.token_number ? parseInt(product.metadata.token_number, 10) : null;

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
