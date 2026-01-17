import { ShoppingCart, User, Menu, Globe, MessageCircle, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ThemeToggle } from './ThemeToggle';
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
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm dark:shadow-md transition-colors duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onHomeClick}>
          <img 
            src="/assets/logo.png" 
            alt="MedsZop Logo"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Home Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onHomeClick}
            className="relative dark:hover:bg-slate-800"
            title="Home"
          >
            <Home className="h-5 w-5 dark:text-slate-200" />
            <span className="sr-only">Home</span>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onLanguageToggle}
            className="relative dark:hover:bg-slate-800"
          >
            <Globe className="h-5 w-5 dark:text-slate-200" />
            <span className="sr-only">Toggle language</span>
          </Button>

          {/* Chatbot */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onChatbotClick}
            className="relative dark:hover:bg-slate-800"
          >
            <MessageCircle className="h-5 w-5 dark:text-slate-200" />
            <span className="sr-only">AI Assistant</span>
          </Button>

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCartClick}
            className="relative dark:hover:bg-slate-800"
          >
            <ShoppingCart className="h-5 w-5 dark:text-slate-200" />
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
            <Button variant="ghost" size="icon" onClick={onProfileClick} className="dark:hover:bg-slate-800">
              <User className="h-5 w-5 dark:text-slate-200" />
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
