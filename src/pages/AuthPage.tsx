import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, UserPlus, Chrome } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast({ title: "התחברת בהצלחה! 🎉" });
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              first_name: form.firstName,
              last_name: form.lastName,
              phone: form.phone,
            },
          },
        });
        if (error) throw error;
        toast({ title: "נרשמת בהצלחה! 🎉" });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "משהו השתבש, נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Logo — links home */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="w-14 h-14 rounded-xl bg-gold-gradient flex items-center justify-center mx-auto mb-3">
              <span className="font-display font-black text-accent-foreground text-xl">EM</span>
            </div>
          </Link>
          <h1 className="font-display text-2xl font-black text-foreground">
            {isLogin ? "התחברות" : "הרשמה"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "היכנס לחשבון שלך" : "צור חשבון חדש לפתיחת תיק"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">שם פרטי</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  required={!isLogin}
                  placeholder="דני"
                />
              </div>
              <div>
                <Label htmlFor="lastName">שם משפחה</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  required={!isLogin}
                  placeholder="כהן"
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <div>
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="050-1234567"
                dir="ltr"
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              required
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          <div>
            <Label htmlFor="password">סיסמה</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                minLength={6}
                placeholder="לפחות 6 תווים"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="cta" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <span className="animate-pulse">מעבד...</span>
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                התחבר
              </>
            ) : (
              <>
                <UserPlus size={18} />
                הירשם
              </>
            )}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">או</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            disabled={googleLoading}
            onClick={async () => {
              setGoogleLoading(true);
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast({ title: "שגיאה בהתחברות Google", variant: "destructive" });
                setGoogleLoading(false);
              }
            }}
          >
            <Chrome size={18} />
            {googleLoading ? "מתחבר..." : "התחבר עם Google"}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gold font-semibold hover:underline"
            >
              {isLogin ? "אין לך חשבון? הירשם כאן" : "כבר יש לך חשבון? התחבר"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
