import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children, 
  ...props 
}) => {
  // Base styles that work with the CSS design system
  const baseStyles = 'font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none';
  
  // Use the existing CSS classes from the design system
  const variantStyles = {
    primary: 'btn-wk-primary hover-lift', // Uses CSS .btn-wk-primary class
    secondary: 'btn-wk-secondary hover-lift', // Uses CSS .btn-wk-secondary class
    outline: 'border-2 border-green-500 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white focus:ring-green-500 bg-transparent hover:shadow-theme-lg transition-all duration-300',
    ghost: 'text-green-600 dark:text-green-400 hover:bg-green-500/10 focus:ring-green-500 bg-transparent hover:shadow-theme-sm transition-all duration-300'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;