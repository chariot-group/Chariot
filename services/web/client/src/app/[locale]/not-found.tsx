import LocaleSwitcher from '@/components/locale/LocaleSwitcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';


export default function NotFound() {
    const t = useTranslations('NotFound');

  return (
    <div className="w-full h-dvh flex flex-col items-center justify-center bg-background">
      <Card className="w-[40%] shadow-md relative">
        <LocaleSwitcher className="absolute right-0 border-none shadow-none m-1 bg-card" />
        <div className="p-6 w-full flex flex-col items-center justify-center gap-[3dvh]">
          <div className="flex flex-col items-center justify-center gap-2">
            <h1 className="text-xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-center">{t('description')}</p>
          </div>
          <img src={"/illustrations/404/404_Owlbear_wb.webp"} alt="Owlbear 404 illustration" className="w-1/2" />
          <Link href={`/campaigns`} >
            <Button>{t('backToHome') || "Back to home"}</Button>
          </Link>
        </div>
      </Card>
    </div>
);
}