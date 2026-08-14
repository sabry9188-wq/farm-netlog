import {
  LayoutDashboard,
  Building2,
  Waves,
  Package,
  ArrowLeftRight,
  Sparkles,
  Wrench,
  History,
  Bird,
  Shield,
  BellRing,
  FileBarChart,
  Users,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  Waves,
  Package,
  ArrowLeftRight,
  Sparkles,
  Wrench,
  History,
  Bird,
  Shield,
  BellRing,
  FileBarChart,
  Users,
  Settings,
  ShieldCheck,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Waves;
  return <Icon className={className} />;
}
