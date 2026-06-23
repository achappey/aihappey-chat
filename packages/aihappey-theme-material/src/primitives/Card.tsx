import { Box, Card as MuiCard, CardActions, CardContent, CardHeader, Typography } from "@mui/material";

export const Card = ({ title, text, description, image, headerActions, children, actions, className, style, selected, size }: any) => {
  const compact = size === "small";
  const avatar = image ? (
    <Box sx={{ width: compact ? 36 : 44, height: compact ? 36 : 44, display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flex: "0 0 auto", "& img": { maxWidth: "100%", maxHeight: "100%" } }}>
      {image}
    </Box>
  ) : undefined;

  return (
    <MuiCard
      variant={selected ? "elevation" : "outlined"}
      className={className}
      sx={{ display: "flex", flexDirection: "column", minHeight: compact ? 176 : undefined, ...style }}
    >
      {title || headerActions || avatar ? (
        <CardHeader
          avatar={avatar}
          title={title}
          action={headerActions}
          titleTypographyProps={{ variant: compact ? "h6" : "h5", sx: { lineHeight: 1.2, overflowWrap: "anywhere" } }}
          sx={{ pb: description ? 0.5 : 0, alignItems: "flex-start", "& .MuiCardHeader-action": { alignSelf: "flex-start", mt: 0 } }}
        />
      ) : null}
      <CardContent sx={{ pt: title || headerActions || avatar ? 1 : undefined, flex: 1 }}>
        {description ? <Box sx={{ mb: 1, display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>{description}</Box> : null}
        {children ?? (text ? <Typography variant="body2">{text}</Typography> : null)}
      </CardContent>
      {actions ? <CardActions sx={{ px: 2, pt: 0, gap: 0.5, flexWrap: "wrap" }}>{actions}</CardActions> : null}
    </MuiCard>
  );
};

