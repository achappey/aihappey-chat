import { useTheme } from "../theme/ThemeContext";
import { OpenLinkButton } from "../buttons/OpenLinkButton";
import { ViewButton } from "../buttons/ViewButton";
import { LimitedTextField } from "../fields";
import { ExperimentalBadge, ModelTypeBadge } from "../badges";

export type ProviderCardProps = {
    name: string;
    url: string;
    image?: string;
    description?: string;
    experimental?: boolean;
    modelTypes?: string[];
    onView?: () => void;
};

export const ProviderCard = ({
    name,
    url,
    image,
    description,
    experimental,
    modelTypes,
    onView,
}: ProviderCardProps) => {
    const { Card, Image } = useTheme();

    const imageItem = image ? (
        <Image height={32} shape="square" src={image} />
    ) : undefined;

    const descriptionItem =
        experimental || (modelTypes?.length ?? 0) > 0 ? (
            <div
                style={{
                    display: "flex",
                    gap: 4,
                    flexWrap: "wrap"
                }}
            >
                {experimental && <ExperimentalBadge size="small" />}

                {modelTypes?.map((type) => (
                    <ModelTypeBadge key={type} modelType={type} />
                ))}
            </div>
        ) : undefined;

    return (
        <Card
            title={name}
            description={descriptionItem}
            image={imageItem}
            actions={
                <div style={{ display: "flex", gap: 8 }}>
                    {onView && (
                        <ViewButton
                            onClick={onView}
                            size="small"
                            variant="subtle"
                        />
                    )}
                    <OpenLinkButton url={url} size="small" variant="subtle" />
                </div>
            }
        >
            <LimitedTextField text={description} />
        </Card>
    );
};
