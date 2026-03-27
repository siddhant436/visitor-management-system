import styled from 'styled-components';
import { theme } from '../../styles/theme';

export const Card = styled.div`
  background: linear-gradient(135deg, ${theme.colors.gray800} 0%, ${theme.colors.gray900} 100%);
  border: 1px solid ${theme.colors.gray700};
  border-radius: ${theme.radius.xl};
  padding: ${theme.spacing[6]};
  box-shadow: ${theme.shadows.md};
  transition: all ${theme.transitions.base};
  animation: fadeIn ${theme.transitions.base};

  &:hover {
    border-color: ${theme.colors.primary};
    box-shadow: ${theme.shadows.lg};
    transform: translateY(-4px);
  }

  ${props => props.hoverable === false && `
    &:hover {
      transform: none;
      box-shadow: ${theme.shadows.md};
    }
  `}
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing[4]};
  padding-bottom: ${theme.spacing[4]};
  border-bottom: 1px solid ${theme.colors.gray700};

  h3 {
    margin: 0;
    font-size: ${theme.fontSizes['2xl']};
  }
`;

export const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

export const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${theme.spacing[6]};
  padding-top: ${theme.spacing[4]};
  border-top: 1px solid ${theme.colors.gray700};
  gap: ${theme.spacing[3]};
`;

export default Card;