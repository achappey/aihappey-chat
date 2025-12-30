import { useTheme } from "../theme/ThemeContext";

interface ToolInvocationStateBadgeProps {
  state: string
  isError?: boolean
  approved?: boolean
  translations?: any
}

export const ToolInvocationStateBadge: React.FC<ToolInvocationStateBadgeProps> = ({
  state,
  isError,
  approved,
  translations
}) => {
  const { Badge } = useTheme();

  return <>
    {state === 'output-available' && (
      isError ? (
        <Badge bg="severe">{translations?.error ?? "error"}</Badge>
      ) : (
        <Badge bg="success">{translations?.success ?? "success"}</Badge>
      )
    )}
    {state === 'approval-responded' && (
      isError ? (
        <Badge bg="severe">{translations?.error ?? "error"}</Badge>
      ) : approved ? (
        <Badge bg="success">{translations?.approved ?? "approved"}</Badge>
      ) : (
        <Badge bg="warning">{translations?.denied ?? "denied"}</Badge>
      )
    )}
    {state === 'output-error' && <Badge bg="severe">{translations?.outputError ?? state}</Badge>}
    {state === 'input-streaming' && <Badge bg="subtle">{translations?.inputStreaming ?? state}</Badge>}
    {state === 'input-available' && <Badge bg="subtle">{translations?.inputAvailable ?? state}</Badge>}
  </>;
};
