import { ShoppingCart, User, Menu, Globe, MessageCircle, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Language } from '../types';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onProfileClick: () => void;
  onChatbotClick: () => void;
  onLoginClick: () => void;
  onHomeClick: () => void;
  isLoggedIn: boolean;
  language: Language;
  onLanguageToggle: () => void;
}

export function Header({
  cartCount,
  onCartClick,
  onProfileClick,
  onChatbotClick,
  onLoginClick,
  onHomeClick,
  isLoggedIn,
  language,
  onLanguageToggle,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={onHomeClick}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--health-blue)] to-[var(--health-green)]">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-[var(--health-blue)]">MedsZop</h1>
            <p className="text-xs text-muted-foreground">60 min delivery</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Home Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onHomeClick}
            className="relative"
            title="Home"
          >
            <Home className="h-5 w-5" />
            <span className="sr-only">Home</span>
          </Button>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onLanguageToggle}
            className="relative"
          >
            <Globe className="h-5 w-5" />
            <span className="sr-only">Toggle language</span>
          </Button>

          {/* Chatbot */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onChatbotClick}
            className="relative"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="sr-only">AI Assistant</span>
          </Button>

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCartClick}
            className="relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
              >
                {cartCount}
              </Badge>
            )}
            <span className="sr-only">Cart</span>
          </Button>

          {/* Profile / Login */}
          {isLoggedIn ? (
            <Button variant="ghost" size="icon" onClick={onProfileClick}>
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Button>
          ) : (
            <Button onClick={onLoginClick} className="bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)]">
              {language === 'en' ? 'Login' : 'लॉगिन'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
