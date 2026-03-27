import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Eye, EyeOff } from 'lucide-react';

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
`;

const Label = styled.label`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.white};
  text-transform: capitalize;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  padding-right: ${props => props.icon ? `${theme.spacing[12]}` : 'auto'};
  
  background: ${theme.colors.gray800};
  border: 2px solid ${theme.colors.gray700};
  border-radius: ${theme.radius.lg};
  color: ${theme.colors.white};
  font-size: ${theme.fontSizes.base};
  font-family: ${theme.fonts.primary};
  
  transition: all ${theme.transitions.base};

  &::placeholder {
    color: ${theme.colors.gray500};
  }

  &:focus {
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    background: ${theme.colors.gray700};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: ${theme.colors.gray900};
  }

  ${props => props.error && `
    border-color: ${theme.colors.error};
    
    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  `}
`;

const IconButton = styled.button`
  position: absolute;
  right: ${theme.spacing[4]};
  background: none;
  border: none;
  color: ${theme.colors.gray400};
  cursor: pointer;
  padding: ${theme.spacing[1]};
  display: flex;
  align-items: center;
  transition: color ${theme.transitions.fast};

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const ErrorMessage = styled.span`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.error};
  display: flex;
  align-items: center;
  gap: ${theme.spacing[1]};
`;

const SuccessMessage = styled.span`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.success};
`;

export const Input = React.forwardRef(({
  label,
  type = 'text',
  error,
  success,
  icon: Icon,
  showPasswordToggle = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle && showPassword ? 'text' : type;

  return (
    <InputWrapper>
      {label && <Label>{label}</Label>}
      <InputContainer>
        <StyledInput
          ref={ref}
          type={inputType}
          error={error}
          icon={Icon || (showPasswordToggle && type === 'password')}
          {...props}
        />
        {Icon && <Icon style={{ position: 'absolute', right: theme.spacing[4], color: theme.colors.gray400 }} size={20} />}
        {showPasswordToggle && type === 'password' && (
          <IconButton
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </IconButton>
        )}
      </InputContainer>
      {error && <ErrorMessage>⚠️ {error}</ErrorMessage>}
      {success && <SuccessMessage>✅ {success}</SuccessMessage>}
    </InputWrapper>
  );
});

Input.displayName = 'Input';

export default Input;