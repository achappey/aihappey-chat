import { useTheme } from "../theme/ThemeContext";

interface ToolInvocationStateBadgeProps {
  state: string
  output?: any
  translations?: any
}

export const ToolInvocationStateBadge: React.FC<ToolInvocationStateBadgeProps> = ({
  state,
  output,
  translations
}) => {
  const { Badge } = useTheme();

  return <>
    {state === 'output-available' && (
      output?.isError ? (
        <Badge bg="severe">{translations?.error ?? "error"}</Badge>
      ) : (
        <Badge bg="success">{translations?.success ?? "success"}</Badge>
      )
    )}
    {state === 'output-error' && <Badge bg="severe">{translations?.outputError ?? state}</Badge>}
    {state === 'input-streaming' && <Badge bg="subtle">{translations?.inputStreaming ?? state}</Badge>}
    {state === 'input-available' && <Badge bg="subtle">{translations?.inputAvailable ?? state}</Badge>}
  </>;
};
