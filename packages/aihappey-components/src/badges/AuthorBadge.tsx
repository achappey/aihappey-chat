import { useTheme } from "../theme/ThemeContext";

interface AuthorBadgeProps {
  author?: string;
}

export const AuthorBadge: React.FC<AuthorBadgeProps> = ({
  author,
}) => {
  const { Badge } = useTheme();
  return <Badge
    appearance="outline"
    key={author}
    bg="informative">
    {author}
  </Badge>;
};
