import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

export default async function SessionPage({ params }: Props) {
  const { locale, code } = await params;
  redirect(`/${locale}/welcome?join=${code}`);
}
