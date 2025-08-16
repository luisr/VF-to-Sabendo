"use client";
import { useState, useEffect } from 'react';
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUsers } from "@/hooks/use-users";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import ProfileAvatar from '@/components/settings/profile-avatar';
import { Loader2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { user, loading, updateUser } = useUsers();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notificationsWhatsapp, setNotificationsWhatsapp] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phone_number || '');
      setNotificationsWhatsapp(user.notifications_whatsapp);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    
    let avatarUrl = user.avatar_url;

    if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `public/avatars/${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('tosabendo2').upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: avatarFile.type,
        });

        if (uploadError) {
            toast({ title: "Erro de Upload", description: uploadError.message, variant: "destructive" });
            setIsSaving(false);
            return;
        }
        
        // **CORREÇÃO: Usando o nome correto do bucket**
        const { data } = supabase.storage.from('tosabendo2').getPublicUrl(filePath);
        avatarUrl = data.publicUrl;
    }

    const { success, error } = await updateUser({
      id: user.id,
      name,
      phone_number: phoneNumber,
      avatar_url: avatarUrl
    });

    if (success) {
        toast({ title: "Sucesso!", description: "Seu perfil foi atualizado." });
    } else {
        toast({ title: "Erro", description: error || "Não foi possível atualizar o perfil.", variant: "destructive"});
    }
    
    setIsSaving(false);
  };

  const handleToggleWhatsapp = async (checked: boolean) => {
    if (!user) return;
    setNotificationsWhatsapp(checked);
    const { success, error } = await updateUser({ id: user.id, notifications_whatsapp: checked });
    if (success) {
      toast({ title: "Sucesso!", description: "Preferência de notificação atualizada." });
    } else {
      setNotificationsWhatsapp(prev => !prev);
      const message = error || "Não foi possível atualizar as preferências.";
      console.error(message);
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
  };
  
  if (loading) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Configurações" />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Atualize suas informações pessoais e foto de perfil.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <ProfileAvatar 
                src={user?.avatar_url}
                fallback={name.charAt(0).toUpperCase()}
                onFileSelect={setAvatarFile}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Salvar Perfil
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Gerencie suas notificações do WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-whatsapp">Notificações via WhatsApp</Label>
              <Switch
                id="notifications-whatsapp"
                checked={notificationsWhatsapp}
                onCheckedChange={handleToggleWhatsapp}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
