import React, { useState, InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  error,
  showPasswordToggle = false,
  type = 'text',
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hasValue = props.value && String(props.value).length > 0;

  const inputType = showPasswordToggle && showPassword ? 'text' : type;

  return (
    <div className="relative w-full">
      <input
        {...props}
        type={inputType}
        className={`
          peer w-full px-4 pt-6 pb-2 text-base
          bg-white dark:bg-gray-800
          border-2 rounded-lg
          transition-all duration-200
          outline-none
          ${error 
            ? 'border-red-500 focus:border-red-600' 
            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
          }
          ${showPasswordToggle ? 'pr-12' : ''}
          ${className}
        `}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        placeholder=" "
      />
      
      <label
        className={`
          absolute left-4 transition-all duration-200 pointer-events-none
          ${isFocused || hasValue
            ? 'top-2 text-xs text-primary-600 dark:text-primary-400'
            : 'top-1/2 -translate-y-1/2 text-base text-gray-500 dark:text-gray-400'
          }
          ${error ? 'text-red-500' : ''}
        `}
      >
        {label}
      </label>

      {showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};
