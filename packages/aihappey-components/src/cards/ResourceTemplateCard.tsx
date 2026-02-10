import type { ResourceTemplate } from "aihappey-mcp";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { MimeTypeBadge, PriorityBadge } from "../badges";
import { CapabilityIcon } from "../images";

type ResourceTemplateCardProps = {
    resourceTemplate: ResourceTemplate;
    onSelect?: () => void;
};

export const ResourceTemplateCard = ({
    resourceTemplate,
    onSelect,
}: ResourceTemplateCardProps) => {
    const { Card, Button, Badge } = useTheme();
    const { t } = useTranslation();
    const icon = <CapabilityIcon icons={resourceTemplate?.icons} />;
    const content = resourceTemplate?.description || resourceTemplate?.uriTemplate;
    const description = (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Badge>{t("template")}</Badge>
            <MimeTypeBadge mimeType={resourceTemplate?.mimeType} />
            <PriorityBadge priority={resourceTemplate?.annotations?.priority} />
        </div>
    );

    return (
        <Card
            title={resourceTemplate?.title ?? resourceTemplate?.name}
            description={description}
            size="small"
            image={icon}
            actions={
                <Button
                    onClick={onSelect}
                    variant="transparent"
                    icon="add"
                    size="small"
                />
            }
        >
            {content}
        </Card>
    );
};

