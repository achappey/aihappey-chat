import { useTheme } from "../theme/ThemeContext";
import { OpenLinkButton } from "../buttons/OpenLinkButton";
import { ViewButton } from "../buttons/ViewButton";
import { LimitedTextField } from "../fields";
import { ExperimentalBadge, ModelTypeBadge } from "../badges";
import { ProviderUrls } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import Flag from "react-world-flags";

export type ProviderCardProps = {
    name: string;
    urls?: ProviderUrls;
    image?: string;
    description?: string;
    providerCountry?: string
    experimental?: boolean;
    selected?: boolean;
    modelTypes?: string[];
    onView?: () => void;
};

export const ProviderCard = ({
    name,
    urls,
    image,
    description,
    selected,
    experimental,
    providerCountry,
    modelTypes,
    onView,
}: ProviderCardProps) => {
    const { Card, Image } = useTheme();
    const { t } = useTranslation();
    const websiteUrl = urls?.homepage;

    const imageItem = image ? (
        <Image height={40} shape="square" src={image} />
    ) : undefined;

    const descriptionItem =
        experimental || (modelTypes?.length ?? 0) > 0 ? (
            <div
                style={{
                    display: "flex",
                    gap: 4,
                    minHeight: 36,
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
            selected={selected}
            headerActions={<>{providerCountry
                && <Flag code={providerCountry}
                    title={providerCountry}
                    height={18} />}</>}
            image={imageItem}
            actions={
                <div style={{ display: "flex", gap: 8 }}>
                    {onView && (
                        <ViewButton
                            onClick={onView}
                            size="small"
                            title={t('view')}
                            variant="subtle"
                        />
                    )}
                    {websiteUrl
                        && <OpenLinkButton
                            url={websiteUrl}
                            tooltip={t('website')}
                            icon={"globe"}
                            size="small"
                            variant="subtle" />}
                    {urls?.pricing
                        && <OpenLinkButton
                            url={urls?.pricing}
                            tooltip={t('pricing')}
                            icon={"pricing"}
                            size="small"
                            variant="subtle" />}
                    {urls?.console
                        && <OpenLinkButton
                            url={urls?.console}
                            tooltip={t('console')}
                            icon={"console"}
                            size="small"
                            variant="subtle" />}
                    {urls?.docs
                        && <OpenLinkButton
                            url={urls?.docs}
                            icon={"docs"}
                            tooltip={t('documentation')}
                            size="small"
                            variant="subtle" />}
                    {urls?.termsOfService
                        && <OpenLinkButton
                            url={urls?.termsOfService}
                            tooltip={t('terms')}
                            icon={"terms"}
                            size="small"
                            variant="subtle" />}
                    {urls?.privacyPolicy
                        && <OpenLinkButton
                            url={urls?.privacyPolicy}
                            tooltip={t('privacy')}
                            icon={"privacy"}
                            size="small"
                            variant="subtle" />}
                </div>
            }
        >
            <LimitedTextField text={description} minHeight={40} />
        </Card>
    );
};
