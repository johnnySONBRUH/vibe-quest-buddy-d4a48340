import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, User, Bell, Save, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { languages } from '@/i18n';

interface NotificationPrefs {
  daily_reminder: boolean;
  streak_warning: boolean;
  achievements: boolean;
}

const ProfileSettings = ({ onBack }: { onBack: () => void }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationPrefs>({
    daily_reminder: true, streak_warning: true, achievements: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('display_name, avatar_url, notification_preferences').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name || '');
        setAvatarUrl(data.avatar_url);
        if (data.notification_preferences) setNotifications(data.notification_preferences as unknown as NotificationPrefs);
        setLoaded(true);
      }
    });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t('settings.fileTooLarge'), description: t('settings.fileTooLargeDesc'), variant: 'destructive' });
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: t('settings.uploadFailed'), description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(`${urlData.publicUrl}?t=${Date.now()}`);
    setUploading(false);
    toast({ title: t('settings.avatarUploaded') });
  };

  const handleSave = async () => {
    if (!user) return;
    const trimmed = displayName.trim();
    if (!trimmed || trimmed.length > 50) {
      toast({ title: t('settings.invalidName'), description: t('settings.invalidNameDesc'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: trimmed, avatar_url: avatarUrl,
      notification_preferences: notifications as unknown as import('@/integrations/supabase/types').Json,
    }).eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: t('settings.saveFailed'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('settings.saved') });
      onBack();
    }
  };

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('questup_language', code);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20} /></Button>
          <div className="flex items-center gap-2">
            <User className="text-primary" size={24} />
            <h1 className="text-xl font-bold text-foreground">{t('settings.title')}</h1>
          </div>
        </motion.div>

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center cursor-pointer group overflow-hidden" onClick={() => fileInputRef.current?.click()}>
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={36} className="text-muted-foreground" />}
            <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? <Loader2 size={24} className="text-background animate-spin" /> : <Camera size={24} className="text-background" />}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <p className="text-xs text-muted-foreground">{t('settings.avatarHint')}</p>
        </motion.div>

        {/* Display Name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6 space-y-3">
          <Label htmlFor="displayName" className="text-sm font-semibold text-foreground">{t('settings.displayName')}</Label>
          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('auth.yourName')} maxLength={50} className="bg-background" />
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }} className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="text-primary" size={20} />
            <h3 className="text-base font-bold text-foreground">{t('settings.language')}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{t('settings.languageDesc')}</p>
          <div className="grid grid-cols-2 gap-2">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  i18n.language === lang.code || (i18n.language.startsWith(lang.code))
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-foreground border-border hover:bg-muted'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Bell className="text-primary" size={20} />
            <h3 className="text-base font-bold text-foreground">{t('settings.notifications')}</h3>
          </div>
          {[
            { key: 'daily_reminder' as const, label: t('settings.dailyReminders'), desc: t('settings.dailyRemindersDesc') },
            { key: 'streak_warning' as const, label: t('settings.streakWarnings'), desc: t('settings.streakWarningsDesc') },
            { key: 'achievements' as const, label: t('settings.achievementsNotif'), desc: t('settings.achievementsNotifDesc') },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={notifications[key]} onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [key]: checked }))} />
            </div>
          ))}
        </motion.div>

        {/* Save */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Button onClick={handleSave} disabled={saving || !loaded} className="w-full gap-2">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {t('settings.save')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileSettings;
