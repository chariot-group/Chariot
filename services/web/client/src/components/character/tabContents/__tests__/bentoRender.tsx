import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useForm, type FieldValues, type UseFormReturn } from "react-hook-form";

/**
 * Test helpers rendering the bento tabs to static markup (translation keys as text).
 * @see FR-character-general-bento-layout, FR-character-battle-bento-layout
 */
export const render = (ui: ReactElement) =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={{}}
      onError={() => {}}
      getMessageFallback={({ key }) => key}>
      {ui}
    </NextIntlClientProvider>,
  );

export function WithForm({
  values,
  children,
}: {
  values: FieldValues;
  children: (form: UseFormReturn<FieldValues>) => ReactElement;
}) {
  const form = useForm<FieldValues>({ defaultValues: values });
  return children(form);
}
