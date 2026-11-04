import * as React from "react";

/** Aligné sur le breakpoint Tailwind `md` — sidebar en overlay. */
export const MOBILE_BREAKPOINT = 768;

/** Aligné sur le breakpoint Tailwind `lg` — téléphone + tablette. */
export const TABLET_BREAKPOINT = 1024;

/** Aligné sur le breakpoint Tailwind `xl`. */
export const XL_BREAKPOINT = 1280;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

/** True en dessous de `lg` (1024px) : téléphone et tablette. */
export function useIsTabletOrMobile() {
  const [isTabletOrMobile, setIsTabletOrMobile] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsTabletOrMobile(window.innerWidth < TABLET_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isTabletOrMobile;
}

/** True à partir de `xl` (1280px). False au premier rendu (SSR), puis suit la largeur de l'écran. */
export function useIsXlUp() {
  const [isXlUp, setIsXlUp] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${XL_BREAKPOINT}px)`);
    const onChange = () => setIsXlUp(mql.matches);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isXlUp;
}
