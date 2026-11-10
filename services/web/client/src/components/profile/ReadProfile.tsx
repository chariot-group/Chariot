import { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { SquarePen } from "lucide-react";
import { MediaAvatar } from "@/components/media/MediaAvatar";
import { isEnterWithoutModifiers } from "@/utils/keyboard.utils";
import {
  profileActionButtonClassName,
  profileAvatarColumnClassName,
  profileCardClassName,
  profileHeaderClassName,
  profileIdentityClassName,
  profileUsernameClassName,
} from "@/components/profile/profileCardLayout";

interface Props {
  user: User | null;
  onEdit: () => void;
  isLoading?: boolean;
}
export default function ReadProfile({ user, onEdit, isLoading = false }: Props) {
  const t = useTranslations("ProfilePage");
  const tEdit = useTranslations("ProfilePage.editProfile");
  const tAuth = useTranslations("auth");
  return (
    <Card
      className={profileCardClassName}
      role="region"
      aria-labelledby="profile-info-heading">
      <h2
        id="profile-info-heading"
        className="sr-only">
        {t("pageTitle")}
      </h2>
      <div className={profileHeaderClassName}>
        <div
          className={profileAvatarColumnClassName}
          role="img"
          aria-label={user?.username ? `${user.username} profile picture` : "Default profile picture"}>
          {user?.keycloakId ? (
            <MediaAvatar
              scope="user"
              entityId={user.keycloakId}
              storedValue={user.avatar}
              size="profile"
              alt={user.username ? `${user.username} profile picture` : "Profile picture"}
              priority
            />
          ) : null}
        </div>
        <div className={profileIdentityClassName}>
          <p
            className={profileUsernameClassName}
            aria-label="Username">
            {user?.username}
          </p>
          <p
            className="text-base sm:text-lg lg:text-xl font-semibold wrap-break-word"
            aria-label="Full name">{`${user?.firstName} ${user?.lastName}`}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
        <p
          className="text-sm text-muted-foreground break-all min-w-0"
          aria-label="Email address">
          {user?.email}
        </p>
        <Button
          type="button"
          onClick={onEdit}
          disabled={isLoading}
          className={`shrink-0 ${profileActionButtonClassName}`}
          onKeyDown={(e) => {
            if (isEnterWithoutModifiers(e) || e.key === " ") {
              e.preventDefault();
              onEdit();
            }
          }}>
          <SquarePen aria-hidden="true" /> {isLoading ? tAuth("loading") : tEdit("updateProfile")}
        </Button>
      </div>
    </Card>
  );
}
