import { useTheme } from "../theme/ThemeContext";

interface AuthorBadgeProps {
  author?: string;
}

export const AuthorBadge: React.FC<AuthorBadgeProps> = ({
  author,
}) => {
  const { Badge } = useTheme();
  return <Badge
    appearance="neutral"
    size={"small"}
    key={author}
    icon="personalization">
    {author}
  </Badge>;
};
