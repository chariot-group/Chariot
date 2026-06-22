import {
  Link,
  BookOpen,
  Map,
  Scroll,
  Music,
  Globe,
  FileText,
  Image,
  Video,
  Dice5,
  Sword,
  Shield,
  Star,
  Flame,
  Skull,
  Compass,
  Headphones,
  Camera,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface QuickLinkIconOption {
  name: string;
  icon: LucideIcon;
  label: string;
}

export const QUICK_LINK_ICONS: QuickLinkIconOption[] = [
  { name: "Link", icon: Link, label: "Lien" },
  { name: "BookOpen", icon: BookOpen, label: "Livre" },
  { name: "Map", icon: Map, label: "Carte" },
  { name: "Scroll", icon: Scroll, label: "Parchemin" },
  { name: "Dice5", icon: Dice5, label: "Dé" },
  { name: "Sword", icon: Sword, label: "Épée" },
  { name: "Shield", icon: Shield, label: "Bouclier" },
  { name: "Skull", icon: Skull, label: "Crâne" },
  { name: "Flame", icon: Flame, label: "Flamme" },
  { name: "Star", icon: Star, label: "Étoile" },
  { name: "Compass", icon: Compass, label: "Boussole" },
  { name: "Globe", icon: Globe, label: "Globe" },
  { name: "Music", icon: Music, label: "Musique" },
  { name: "Headphones", icon: Headphones, label: "Casque" },
  { name: "Video", icon: Video, label: "Vidéo" },
  { name: "FileText", icon: FileText, label: "Document" },
  { name: "Image", icon: Image, label: "Image" },
  { name: "Camera", icon: Camera, label: "Photo" },
];

export function getIconByName(name: string): LucideIcon {
  return QUICK_LINK_ICONS.find((i) => i.name === name)?.icon ?? Link;
}
