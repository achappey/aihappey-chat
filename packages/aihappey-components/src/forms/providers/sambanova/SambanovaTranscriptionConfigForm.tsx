import React, { useMemo } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type SambanovaTranscriptionConfig = {
    language?: string;
    prompt?: string;
};

const LANGUAGE_NATIVE_NAMES: Record<string, string> = {
    en: "English",
    zh: "中文",
    de: "Deutsch",
    es: "Español",
    ru: "Русский",
    ko: "한국어",
    fr: "Français",
    ja: "日本語",
    pt: "Português",
    tr: "Türkçe",
    pl: "Polski",
    ca: "Català",
    nl: "Nederlands",
    ar: "العربية",
    sv: "Svenska",
    it: "Italiano",
    id: "Bahasa Indonesia",
    hi: "हिन्दी",
    fi: "Suomi",
    vi: "Tiếng Việt",
    he: "עברית",
    uk: "Українська",
    el: "Ελληνικά",
    ms: "Bahasa Melayu",
    cs: "Čeština",
    ro: "Română",
    da: "Dansk",
    hu: "Magyar",
    ta: "தமிழ்",
    no: "Norsk",
    th: "ไทย",
    ur: "اردو",
    hr: "Hrvatski",
    bg: "Български",
    lt: "Lietuvių",
    la: "Latina",
    mi: "Māori",
    ml: "മലയാളം",
    cy: "Cymraeg",
    sk: "Slovenčina",
    te: "తెలుగు",
    fa: "فارسی",
    lv: "Latviešu",
    bn: "বাংলা",
    sr: "Српски",
    az: "Azərbaycan",
    sl: "Slovenščina",
    kn: "ಕನ್ನಡ",
    et: "Eesti",
    mk: "Македонски",
    br: "Brezhoneg",
    eu: "Euskara",
    is: "Íslenska",
    hy: "Հայերեն",
    ne: "नेपाली",
    mn: "Монгол",
    bs: "Bosanski",
    kk: "Қазақ",
    sq: "Shqip",
    sw: "Kiswahili",
    gl: "Galego",
    mr: "मराठी",
    pa: "ਪੰਜਾਬੀ",
    si: "සිංහල",
    km: "ខ្មែរ",
    sn: "ChiShona",
    yo: "Yorùbá",
    so: "Soomaali",
    af: "Afrikaans",
    oc: "Occitan",
    ka: "ქართული",
    be: "Беларуская",
    tg: "Тоҷикӣ",
    sd: "سنڌي",
    gu: "ગુજરાતી",
    am: "አማርኛ",
    yi: "ייִדיש",
    lo: "ລາວ",
    uz: "Oʻzbek",
    fo: "Føroyskt",
    ht: "Kreyòl ayisyen",
    ps: "پښتو",
    tk: "Türkmen",
    nn: "Nynorsk",
    mt: "Malti",
    sa: "संस्कृतम्",
    lb: "Lëtzebuergesch",
    my: "မြန်မာ",
    bo: "བོད་ཡིག",
    tl: "Tagalog",
    mg: "Malagasy",
    as: "অসমীয়া",
    tt: "Татар",
    haw: "ʻŌlelo Hawaiʻi",
    ln: "Lingála",
    ha: "Hausa",
    ba: "Башҡорт",
    jw: "Basa Jawa",
    su: "Basa Sunda",
    yue: "粵語",
};


export const SambanovaTranscriptionConfigForm: React.FC<{
    config: SambanovaTranscriptionConfig;
    updateConfig: (val: SambanovaTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const languageOptions = useMemo(
        () => [
            { value: "", label: t("providerDefault") },
            ...Object.entries(LANGUAGE_NATIVE_NAMES).map((code) => ({
                value: code[0],
                label: code[1] ?? code[0],
            })),
        ],
        [t]
    );


    const currentLanguage = config?.language ?? "";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("general")}>
                <div>
                    <theme.Select
                        label={t("language")}
                        values={[currentLanguage]}
                        valueTitle={
                            languageOptions.find((o) => o.value === currentLanguage)?.label
                        }
                        options={languageOptions}
                        onChange={(val: string) =>
                            updateConfig({
                                ...config,
                                language: val?.trim() ? val : undefined,
                            })
                        }
                    >
                        {languageOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>

                    <theme.TextArea
                        label={t("providers:openai.prompt")}
                        placeholder={t("providers:openai.speechPromptPlaceholder")}
                        rows={5}
                        value={config?.prompt ?? ""}
                        onChange={(value) =>
                            updateConfig({
                                ...config,
                                prompt: value,
                            })
                        }
                    />
                </div>
            </theme.Card>
        </div>
    );
};

