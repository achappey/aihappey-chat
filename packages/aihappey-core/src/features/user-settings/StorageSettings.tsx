// settings/StorageSettings.tsx
import { ChartJsBlock } from "aihappey-components";
import { useStorageUsage } from "./useStorageUsage";
import { useTranslation } from "aihappey-i18n";

const mb = (b: number) => Math.round(b / 1024 / 1024);

export const StorageSettings = () => {
    const storage = useStorageUsage();
    const { t } = useTranslation();

    if (!storage) {
        return <div>{t('storage.unavailable')}.</div>;
    }

    const chart = {
        type: "doughnut",
        data: {
            labels: [t('storage.used'), t('storage.free')],
            datasets: [
                {
                    data: [storage.used, storage.free],
                    backgroundColor: ["#8b5cf6", "#e5e7eb"],
                    borderWidth: 0,
                },
            ],
        },
        options: {
            plugins: {
                legend: { position: "bottom" },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) =>
                            `${ctx.label}: ${mb(ctx.raw)} MB`,
                    },
                },
            },
            cutout: "70%",
        },
    };

    return (
        <div style={{ padding: 12 }}>
            <ChartJsBlock
                type={chart.type}
                data={chart.data}
                options={chart.options}
                height={220}
            />

            <div style={{ marginTop: 12, fontSize: 13 }}>
                <div><b>{t('storage.used')}:</b> {mb(storage.used)} MB</div>
                <div><b>{t('storage.free')}:</b> {mb(storage.free)} MB</div>
                <div><b>{t('storage.quota')}:</b> {mb(storage.quota)} MB</div>
            </div>
        </div>
    );
};
