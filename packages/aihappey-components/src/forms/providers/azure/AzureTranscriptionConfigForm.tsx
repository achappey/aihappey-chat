import React, { useMemo } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type AzureTranscriptionConfig = {
    language?: string; // BCP-47 locale
};

type LanguageOption = {
    value: string;
    label: string;
};

const AZURE_LANGUAGES: LanguageOption[] = [
    { value: "af-ZA", label: "Afrikaans (South Africa)" },
    { value: "am-ET", label: "Amharic (Ethiopia)" },

    { value: "ar-AE", label: "Arabic (United Arab Emirates)" },
    { value: "ar-BH", label: "Arabic (Bahrain)" },
    { value: "ar-DZ", label: "Arabic (Algeria)" },
    { value: "ar-EG", label: "Arabic (Egypt)" },
    { value: "ar-IL", label: "Arabic (Israel)" },
    { value: "ar-IQ", label: "Arabic (Iraq)" },
    { value: "ar-JO", label: "Arabic (Jordan)" },
    { value: "ar-KW", label: "Arabic (Kuwait)" },
    { value: "ar-LB", label: "Arabic (Lebanon)" },
    { value: "ar-LY", label: "Arabic (Libya)" },
    { value: "ar-MA", label: "Arabic (Morocco)" },
    { value: "ar-OM", label: "Arabic (Oman)" },
    { value: "ar-PS", label: "Arabic (Palestinian Authority)" },
    { value: "ar-QA", label: "Arabic (Qatar)" },
    { value: "ar-SA", label: "Arabic (Saudi Arabia)" },
    { value: "ar-SY", label: "Arabic (Syria)" },
    { value: "ar-TN", label: "Arabic (Tunisia)" },
    { value: "ar-YE", label: "Arabic (Yemen)" },

    { value: "as-IN", label: "Assamese (India)" },
    { value: "az-AZ", label: "Azerbaijani (Latin, Azerbaijan)" },
    { value: "bg-BG", label: "Bulgarian (Bulgaria)" },
    { value: "bn-IN", label: "Bengali (India)" },
    { value: "bs-BA", label: "Bosnian (Bosnia and Herzegovina)" },
    { value: "ca-ES", label: "Catalan" },
    { value: "cs-CZ", label: "Czech (Czechia)" },
    { value: "cy-GB", label: "Welsh (United Kingdom)" },
    { value: "da-DK", label: "Danish (Denmark)" },

    { value: "de-AT", label: "German (Austria)" },
    { value: "de-CH", label: "German (Switzerland)" },
    { value: "de-DE", label: "German (Germany)" },

    { value: "el-GR", label: "Greek (Greece)" },

    { value: "en-AU", label: "English (Australia)" },
    { value: "en-CA", label: "English (Canada)" },
    { value: "en-GB", label: "English (United Kingdom)" },
    { value: "en-GH", label: "English (Ghana)" },
    { value: "en-HK", label: "English (Hong Kong SAR)" },
    { value: "en-IE", label: "English (Ireland)" },
    { value: "en-IN", label: "English (India)" },
    { value: "en-KE", label: "English (Kenya)" },
    { value: "en-NG", label: "English (Nigeria)" },
    { value: "en-NZ", label: "English (New Zealand)" },
    { value: "en-PH", label: "English (Philippines)" },
    { value: "en-SG", label: "English (Singapore)" },
    { value: "en-TZ", label: "English (Tanzania)" },
    { value: "en-US", label: "English (United States)" },
    { value: "en-ZA", label: "English (South Africa)" },

    { value: "es-AR", label: "Spanish (Argentina)" },
    { value: "es-BO", label: "Spanish (Bolivia)" },
    { value: "es-CL", label: "Spanish (Chile)" },
    { value: "es-CO", label: "Spanish (Colombia)" },
    { value: "es-CR", label: "Spanish (Costa Rica)" },
    { value: "es-CU", label: "Spanish (Cuba)" },
    { value: "es-DO", label: "Spanish (Dominican Republic)" },
    { value: "es-EC", label: "Spanish (Ecuador)" },
    { value: "es-ES", label: "Spanish (Spain)" },
    { value: "es-GQ", label: "Spanish (Equatorial Guinea)" },
    { value: "es-GT", label: "Spanish (Guatemala)" },
    { value: "es-HN", label: "Spanish (Honduras)" },
    { value: "es-MX", label: "Spanish (Mexico)" },
    { value: "es-NI", label: "Spanish (Nicaragua)" },
    { value: "es-PA", label: "Spanish (Panama)" },
    { value: "es-PE", label: "Spanish (Peru)" },
    { value: "es-PR", label: "Spanish (Puerto Rico)" },
    { value: "es-PY", label: "Spanish (Paraguay)" },
    { value: "es-SV", label: "Spanish (El Salvador)" },
    { value: "es-US", label: "Spanish (United States)" },
    { value: "es-UY", label: "Spanish (Uruguay)" },
    { value: "es-VE", label: "Spanish (Venezuela)" },

    { value: "et-EE", label: "Estonian (Estonia)" },
    { value: "eu-ES", label: "Basque" },
    { value: "fa-IR", label: "Persian (Iran)" },
    { value: "fi-FI", label: "Finnish (Finland)" },
    { value: "fil-PH", label: "Filipino (Philippines)" },

    { value: "fr-BE", label: "French (Belgium)" },
    { value: "fr-CA", label: "French (Canada)" },
    { value: "fr-CH", label: "French (Switzerland)" },
    { value: "fr-FR", label: "French (France)" },

    { value: "ga-IE", label: "Irish (Ireland)" },
    { value: "gl-ES", label: "Galician" },
    { value: "gu-IN", label: "Gujarati (India)" },
    { value: "he-IL", label: "Hebrew (Israel)" },
    { value: "hi-IN", label: "Hindi (India)" },
    { value: "hr-HR", label: "Croatian (Croatia)" },
    { value: "hu-HU", label: "Hungarian (Hungary)" },
    { value: "hy-AM", label: "Armenian (Armenia)" },
    { value: "id-ID", label: "Indonesian (Indonesia)" },
    { value: "is-IS", label: "Icelandic (Iceland)" },
    { value: "it-CH", label: "Italian (Switzerland)" },
    { value: "it-IT", label: "Italian (Italy)" },
    { value: "ja-JP", label: "Japanese (Japan)" },
    { value: "jv-ID", label: "Javanese (Indonesia)" },
    { value: "ka-GE", label: "Georgian (Georgia)" },
    { value: "kk-KZ", label: "Kazakh (Kazakhstan)" },
    { value: "ko-KR", label: "Korean (Korea)" },
    { value: "lt-LT", label: "Lithuanian (Lithuania)" },
    { value: "lv-LV", label: "Latvian (Latvia)" },
    { value: "mk-MK", label: "Macedonian (North Macedonia)" },
    { value: "ml-IN", label: "Malayalam (India)" },
    { value: "mn-MN", label: "Mongolian (Mongolia)" },
    { value: "mr-IN", label: "Marathi (India)" },
    { value: "ms-MY", label: "Malay (Malaysia)" },
    { value: "my-MM", label: "Burmese (Myanmar)" },
    { value: "nb-NO", label: "Norwegian Bokmål (Norway)" },
    { value: "nl-BE", label: "Dutch (Belgium)" },
    { value: "nl-NL", label: "Dutch (Netherlands)" },
    { value: "pl-PL", label: "Polish (Poland)" },
    { value: "pt-BR", label: "Portuguese (Brazil)" },
    { value: "pt-PT", label: "Portuguese (Portugal)" },
    { value: "ro-RO", label: "Romanian (Romania)" },
    { value: "ru-RU", label: "Russian (Russia)" },
    { value: "sk-SK", label: "Slovak (Slovakia)" },
    { value: "sl-SI", label: "Slovenian (Slovenia)" },
    { value: "sv-SE", label: "Swedish (Sweden)" },
    { value: "ta-IN", label: "Tamil (India)" },
    { value: "te-IN", label: "Telugu (India)" },
    { value: "th-TH", label: "Thai (Thailand)" },
    { value: "tr-TR", label: "Turkish (Türkiye)" },
    { value: "uk-UA", label: "Ukrainian (Ukraine)" },
    { value: "ur-IN", label: "Urdu (India)" },
    { value: "vi-VN", label: "Vietnamese (Vietnam)" },

    { value: "zh-CN", label: "Chinese (Mandarin, Simplified)" },
    { value: "zh-HK", label: "Chinese (Cantonese, Traditional)" },
    { value: "zh-TW", label: "Chinese (Taiwanese Mandarin, Traditional)" },

    { value: "zu-ZA", label: "isiZulu (South Africa)" },
];

export const AzureTranscriptionConfigForm: React.FC<{
    config: AzureTranscriptionConfig;
    updateConfig: (val: AzureTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const options = useMemo(
        () => [{ value: "auto", label: t("providerDefault") }, ...AZURE_LANGUAGES],
        [t]
    );

    return (
        <theme.Card size="small" title={t("general")}>
            <div>
                <theme.Select
                    label={t("language")}
                    values={[config?.language ?? "auto"]}
                    valueTitle={
                        options.find((o) => o.value === config?.language)?.label ??
                        t("providerDefault")
                    }
                    options={options}
                    onChange={(val: string) =>
                        updateConfig({
                            ...config,
                            language: val === "auto" ? undefined : val,
                        })
                    }
                >
                    {options.map((o) => (
                        <option key={o.value || "auto"} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>
            </div>
        </theme.Card>
    );
};
