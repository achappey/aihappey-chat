import { useTheme } from "../theme/ThemeContext";
import { OpenLinkButton } from "../buttons/OpenLinkButton";
import { LimitedTextField } from "../fields";

export type ProviderCardProps = {
    name: string;
    url: string;
    image?: string;
    description?: string;
};

export const ProviderCard = ({ name, url, image, description }: ProviderCardProps) => {
    const { Card, Image, } = useTheme();

    const imageItem = image ? (
        <Image height={32} shape="square" src={image} />
    ) : undefined;

    return (
        <Card
            title={name}
            image={imageItem}
            size="small"
            actions={<OpenLinkButton url={url} size="small" variant="subtle" />}
        >
            <LimitedTextField text={description} />
        </Card>
    );
};

