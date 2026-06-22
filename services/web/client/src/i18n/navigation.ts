import { createNavigation } from "next-intl/navigation";
import { locales } from "@/i18n/request";

export const { Link, useRouter, usePathname, redirect } = createNavigation({ locales });
