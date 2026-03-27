import styled from 'styled-components';
import { theme } from '../../styles/theme';

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${theme.spacing[4]};
  width: 100%;

  @media (max-width: ${theme.breakpoints.lg}) {
    padding: 0 ${theme.spacing[4]};
  }

  @media (max-width: ${theme.breakpoints.md}) {
    padding: 0 ${theme.spacing[3]};
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.cols || 2}, 1fr);
  gap: ${theme.spacing[6]};

  @media (max-width: ${theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }

  ${props => props.cols === 3 && `
    @media (max-width: ${theme.breakpoints.xl}) {
      grid-template-columns: repeat(2, 1fr);
    }
    @media (max-width: ${theme.breakpoints.md}) {
      grid-template-columns: 1fr;
    }
  `}
`;

export const Flex = styled.div`
  display: flex;
  flex-direction: ${props => props.column ? 'column' : 'row'};
  align-items: ${props => props.align || 'stretch'};
  justify-content: ${props => props.justify || 'flex-start'};
  gap: ${props => props.gap ? theme.spacing[props.gap] : theme.spacing[4]};
  flex-wrap: ${props => props.wrap ? 'wrap' : 'nowrap'};
`;

export const Section = styled.section`
  padding: ${theme.spacing[8]} 0;
  animation: fadeIn ${theme.transitions.base};

  &:not(:last-child) {
    border-bottom: 1px solid ${theme.colors.gray800};
  }
`;

export const PageHeader = styled.div`
  margin-bottom: ${theme.spacing[8]};

  h1 {
    margin-bottom: ${theme.spacing[2]};
    font-size: ${theme.fontSizes['4xl']};
  }

  p {
    color: ${theme.colors.gray400};
    font-size: ${theme.fontSizes.lg};
  }
`;  

export default { Container, Grid, Flex, Section, PageHeader };