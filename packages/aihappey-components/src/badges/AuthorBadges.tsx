import { AuthorBadge } from "./AuthorBadge";

interface AuthorBadgesProps {
  authors?: string[];
}

export const AuthorBadges: React.FC<AuthorBadgesProps> = ({
  authors,
}) => {
  return (
    <div style={{
      display: "flex",
      gap: 4,
      flexWrap: "wrap"
    }}>
      {authors?.map(a => (
        <AuthorBadge
          key={a}
          author={a}
        />
      ))}
    </div>
  );
};
