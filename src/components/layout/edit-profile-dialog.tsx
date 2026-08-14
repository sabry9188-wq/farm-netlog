"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";

export function EditProfileDialog({
  profile,
  open,
  onOpenChange,
}: {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [preview, setPreview] = useState<string | null>(profile.avatar_url);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be under 3MB.");
      return;
    }
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function onSave() {
    startTransition(async () => {
      const supabase = createClient();
      let avatarUrl: string | undefined;

      if (pendingFile) {
        const ext = pendingFile.name.split(".").pop() ?? "jpg";
        const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, pendingFile, {
          upsert: true,
          cacheControl: "3600",
        });
        if (uploadError) {
          toast.error(`Photo upload failed: ${uploadError.message}`);
          return;
        }
        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.rpc("fn_update_own_profile", {
        p_full_name: fullName,
        p_avatar_url: avatarUrl ?? null,
      });
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Profile updated.");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your display name and profile picture.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex size-24 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-border"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Profile" className="size-full object-cover" />
            ) : (
              <User className="size-10 text-muted-foreground" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
              <Camera className="size-6 text-white" />
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Camera className="size-4" /> Change photo
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="full-name">Full name</Label>
          <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
