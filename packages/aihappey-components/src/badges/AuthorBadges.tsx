import { AuthorBadge } from "./AuthorBadge";

interface AuthorBadgesProps {
  authors?: string[];
}

export const AuthorBadges: React.FC<AuthorBadgesProps> = ({
  authors,
}) => {
  return (
    <>
      {authors
        ?.map(a =>
          <AuthorBadge
            key={a}
            author={a}
          />
        )}
    </>
  );
};
