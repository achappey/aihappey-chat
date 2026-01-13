import { useTheme } from "../theme/ThemeContext";
import { OpenLinkButton } from "../buttons/OpenLinkButton";
import { LimitedTextField } from "../fields";
import { ExperimentalBadge } from "../badges";

export type ProviderCardProps = {
    name: string;
    url: string;
    image?: string;
    description?: string;
    experimental?: boolean;
};

export const ProviderCard = ({ name, url, image, description, experimental }: ProviderCardProps) => {
    const { Card, Image, } = useTheme();

    const imageItem = image ? (
        <Image height={32} shape="square" src={image} />
    ) : undefined;

    const descriptionItem = experimental ? (
        <ExperimentalBadge size="small" />
    ) : undefined;

    return (
        <Card
            title={name}
            description={descriptionItem}
            image={imageItem}
            actions={<OpenLinkButton url={url} size="small" variant="subtle" />}
        >
            <LimitedTextField text={description} />
        </Card>
    );
};

