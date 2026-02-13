import { User } from "@/types/user";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { User as UserIcon } from "lucide-react";

interface Props {
  user: User | null;
}
export default function ReadProfile({ user }: Props) {
  const t = useTranslations("ProfilePage");
  return (
    <Card
      className="flex flex-col xl:flex-row overflow-hidden"
      role="region"
      aria-labelledby="profile-info-heading">
      <h2
        id="profile-info-heading"
        className="sr-only">
        {t("pageTitle")}
      </h2>
      <div
        className="relative w-full xl:w-1/2 aspect-video"
        role="img"
        aria-label={user?.username ? `${user.username} profile picture` : "Default profile picture"}>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-middle-light rounded-[15px]">
          <UserIcon
            className="h-16 w-16"
            aria-hidden="true"
          />
        </div>
      </div>
      <div className="flex flex-col justify-between gap-2 sm:gap-3 w-full xl:w-1/2">
        <div>
          <p
            className="text-2xl sm:text-3xl lg:text-4xl font-bold wrap-break-word"
            aria-label="Username">
            {user?.username}
          </p>
          <p
            className="text-base sm:text-lg lg:text-xl font-semibold wrap-break-word"
            aria-label="Full name">{`${user?.firstName} ${user?.lastName}`}</p>
        </div>
        <p
          className="text-xs sm:text-sm text-muted-foreground break-all"
          aria-label="Email address">
          {user?.email}
        </p>
      </div>
    </Card>
  );
}
