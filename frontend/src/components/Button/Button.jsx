import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};
  padding: ${props => {
    switch (props.size) {
      case 'sm': return `${theme.spacing[2]} ${theme.spacing[4]}`;
      case 'lg': return `${theme.spacing[3]} ${theme.spacing[6]}`;
      default: return `${theme.spacing[2]} ${theme.spacing[5]}`;
    }
  }};
  
  font-size: ${props => {
    switch (props.size) {
      case 'sm': return theme.fontSizes.sm;
      case 'lg': return theme.fontSizes.lg;
      default: return theme.fontSizes.base;
    }
  }};
  
  font-weight: ${theme.fontWeights.semibold};
  border-radius: ${theme.radius.lg};
  border: 2px solid transparent;
  cursor: pointer;
  transition: all ${theme.transitions.base};
  white-space: nowrap;
  position: relative;
  overflow: hidden;

  /* Variants */
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%);
          color: ${theme.colors.white};
          box-shadow: ${theme.shadows.lg};

          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: ${theme.shadows.xl};
          }

          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
      
      case 'secondary':
        return `
          background: ${theme.colors.gray700};
          color: ${theme.colors.white};
          border-color: ${theme.colors.gray600};

          &:hover:not(:disabled) {
            background: ${theme.colors.gray600};
            border-color: ${theme.colors.gray500};
          }
        `;
      
      case 'outline':
        return `
          background: transparent;
          color: ${theme.colors.primary};
          border-color: ${theme.colors.primary};

          &:hover:not(:disabled) {
            background: ${theme.colors.primary};
            color: ${theme.colors.white};
          }
        `;
      
      case 'ghost':
        return `
          background: transparent;
          color: ${theme.colors.primary};

          &:hover:not(:disabled) {
            background: rgba(102, 126, 234, 0.1);
          }
        `;
      
      case 'danger':
        return `
          background: ${theme.colors.error};
          color: ${theme.colors.white};

          &:hover:not(:disabled) {
            background: ${theme.colors.errorDark};
            transform: translateY(-2px);
          }
        `;
      
      case 'success':
        return `
          background: ${theme.colors.success};
          color: ${theme.colors.white};

          &:hover:not(:disabled) {
            background: ${theme.colors.successDark};
            transform: translateY(-2px);
          }
        `;
      
      default:
        return '';
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  loading = false,
  disabled = false,
  ...props 
}) => {
  return (
    <StyledButton 
      variant={variant} 
      size={size}
      disabled={disabled || loading}
      {...props}
    >
      {Icon && !loading && <Icon size={20} />}
      {loading && <LoadingSpinner size={size} />}
      {children}
    </StyledButton>
  );
};

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default Button;