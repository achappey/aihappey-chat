import { Breadcrumbs, Link, Typography } from "@mui/material";

export const Breadcrumb = ({ items, className }: any) => (
  <Breadcrumbs className={className}>{items.map((item: any) => item.href ? <Link key={item.key ?? item.href} href={item.href} onClick={item.onClick} underline="hover">{item.label}</Link> : <Typography key={item.key ?? String(item.label)} color="text.primary">{item.label}</Typography>)}</Breadcrumbs>
);

