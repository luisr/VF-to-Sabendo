
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ForgotPasswordModal({ isOpen, onOpenChange }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePasswordReset = async () => {
    if (!email) {
        toast({
            title: "Email obrigatório",
            description: "Por favor, insira seu email.",
            variant: "destructive",
        });
        return;
    }
    setLoading(true);
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        });
        if (error) {
            throw error;
        }
        toast({
            title: "Verifique seu email",
            description: "Se uma conta existir para este email, um link de redefinição de senha foi enviado.",
        });
        onOpenChange(false);
    } catch (error: any) {
        toast({
            title: "Erro",
            description: error.message || "Não foi possível enviar o email de redefinição. Tente novamente.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir sua senha</DialogTitle>
          <DialogDescription>
            Insira seu endereço de email abaixo. Se a conta existir, enviaremos um link para você redefinir sua senha.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email-reset">Email</Label>
            <Input
              id="email-reset"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePasswordReset} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
