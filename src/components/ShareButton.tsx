import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

interface ShareButtonProps {
  text: string;
  title?: string;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'icon' | 'sm' | 'default';
}

const ShareButton = ({ text, title = 'QuestUp Achievement', variant = 'ghost', size = 'icon' }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
      } catch {}
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Share text copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (navigator.share) {
    return (
      <Button variant={variant} size={size} onClick={handleNativeShare} className="text-muted-foreground">
        <Share2 size={18} />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="text-muted-foreground">
          <Share2 size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopy}>
          {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
          Copy to clipboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTwitter}>
          𝕏 Share on X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsApp}>
          📱 Share on WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
