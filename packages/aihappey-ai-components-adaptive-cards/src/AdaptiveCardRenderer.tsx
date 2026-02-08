'use client';

import React from 'react';

interface AdaptiveCardElement {
    type: string;
    [key: string]: unknown;
}

interface AdaptiveCard {
    type: 'AdaptiveCard';
    version: string;
    body?: AdaptiveCardElement[];
    actions?: AdaptiveCardElement[];
}

interface RenderContext {
    onAction: (action: AdaptiveCardElement, data: Record<string, unknown>) => void;
    inputs: Record<string, unknown>;
    setInput: (id: string, value: unknown) => void;
}

// Widget registry for Adaptive Cards elements
const widgets: Record<string, React.FC<any>> = {
    TextBlock: ({ text, size, weight, color, isSubtle, wrap, horizontalAlignment }) => {
        type Size = 'small' | 'default' | 'medium' | 'large' | 'extraLarge';

        const sizeClassMap: Record<Size, string> = {
            small: 'text-xs',
            default: 'text-sm',
            medium: 'text-base',
            large: 'text-lg',
            extraLarge: 'text-2xl',
        };

        const sizeClass =
            sizeClassMap[
            (size && size in sizeClassMap ? size : 'default') as Size
            ];

        type Weight = 'lighter' | 'default' | 'bolder';
        type Align = 'left' | 'center' | 'right';

        const weightClassMap: Record<Weight, string> = {
            lighter: 'font-light',
            default: 'font-normal',
            bolder: 'font-bold',
        };

        const alignClassMap: Record<Align, string> = {
            left: 'text-left',
            center: 'text-center',
            right: 'text-right',
        };

        const weightClass =
            weightClassMap[
            (weight && weight in weightClassMap ? weight : 'default') as Weight
            ];

        const alignClass =
            alignClassMap[
            (horizontalAlignment && horizontalAlignment in alignClassMap
                ? horizontalAlignment
                : 'left') as Align
            ];


        return (
            <p className={`${sizeClass} ${weightClass} ${alignClass} ${isSubtle ? 'text-muted-foreground' : ''} ${wrap !== false ? '' : 'truncate'}`}>
                {text}
            </p>
        );
    },

    Image: ({ url, altText, size, style, horizontalAlignment }) => {
        type Size = 'auto' | 'stretch' | 'small' | 'medium' | 'large';

        const sizeClassMap: Record<Size, string> = {
            auto: '',
            stretch: 'w-full',
            small: 'w-16',
            medium: 'w-32',
            large: 'w-48',
        };

        const sizeClass =
            sizeClassMap[
            (size && size in sizeClassMap ? size : 'auto') as Size
            ];

        return (
            <div className={`flex ${horizontalAlignment === 'center' ? 'justify-center' : horizontalAlignment === 'right' ? 'justify-end' : ''}`}>
                <img
                    src={url}
                    alt={altText || ''}
                    className={`${sizeClass} ${style === 'person' ? 'rounded-full' : ''}`}
                />
            </div>
        );
    },

    Container: ({ items, style, children, ctx }) => {
        type Style = 'default' | 'emphasis' | 'good' | 'attention' | 'warning' | 'accent';

        const styleClassMap: Record<Style, string> = {
            default: '',
            emphasis: 'bg-muted p-2 rounded',
            good: 'bg-green-50 p-2 rounded',
            attention: 'bg-red-50 p-2 rounded',
            warning: 'bg-yellow-50 p-2 rounded',
            accent: 'bg-blue-50 p-2 rounded',
        };

        const styleClass =
            styleClassMap[
            (style && style in styleClassMap ? style : 'default') as Style
            ];

        return (
            <div className={`${styleClass} space-y-2`}>
                {children || items?.map((item: any, i: number) => (
                    <AdaptiveElement key={i} element={item} ctx={ctx} />
                ))}
            </div>
        );
    },

    ColumnSet: ({ columns, ctx }) => (
        <div className="flex gap-2">
            {columns?.map((col: any, i: number) => (
                <AdaptiveElement key={i} element={{ ...col, type: 'Column' }} ctx={ctx} />
            ))}
        </div>
    ),

    Column: ({ items, width, style, ctx }) => {
        const widthClass = width === 'auto' ? 'flex-none' :
            width === 'stretch' ? 'flex-1' :
                typeof width === 'number' ? `flex-[${width}]` : 'flex-1';
        return (
            <div className={`${widthClass} space-y-2`}>
                {items?.map((item: any, i: number) => (
                    <AdaptiveElement key={i} element={item} ctx={ctx} />
                ))}
            </div>
        );
    },

    FactSet: ({ facts }) => (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {facts?.map((fact: any, i: number) => (
                <React.Fragment key={i}>
                    <span className="font-medium">{fact.title}</span>
                    <span>{fact.value}</span>
                </React.Fragment>
            ))}
        </div>
    ),

    ActionSet: ({ actions, ctx }) => (
        <div className="flex gap-2 pt-2">
            {actions?.map((action: any, i: number) => (
                <AdaptiveElement key={i} element={action} ctx={ctx} />
            ))}
        </div>
    ),

    'Input.Text': ({ id, placeholder, label, isMultiline, value, ctx }) => (
        <div className="space-y-1">
            {label && <label className="text-sm font-medium">{label}</label>}
            {isMultiline ? (
                <textarea
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder={placeholder}
                    defaultValue={value}
                    onChange={(e) => ctx.setInput(id, e.target.value)}
                />
            ) : (
                <input
                    type="text"
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder={placeholder}
                    defaultValue={value}
                    onChange={(e) => ctx.setInput(id, e.target.value)}
                />
            )}
        </div>
    ),

    'Input.Number': ({ id, placeholder, label, min, max, value, ctx }) => (
        <div className="space-y-1">
            {label && <label className="text-sm font-medium">{label}</label>}
            <input
                type="number"
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder={placeholder}
                min={min}
                max={max}
                defaultValue={value}
                onChange={(e) => ctx.setInput(id, parseFloat(e.target.value))}
            />
        </div>
    ),

    'Input.Toggle': ({ id, title, label, valueOn = 'true', valueOff = 'false', value, ctx }) => (
        <div className="flex items-center gap-2">
            <input
                type="checkbox"
                id={id}
                defaultChecked={value === valueOn}
                onChange={(e) => ctx.setInput(id, e.target.checked ? valueOn : valueOff)}
            />
            <label htmlFor={id} className="text-sm">{title || label}</label>
        </div>
    ),

    'Input.ChoiceSet': ({ id, choices, isMultiSelect, style, label, placeholder, ctx }) => (
        <div className="space-y-1">
            {label && <label className="text-sm font-medium">{label}</label>}
            {style === 'expanded' ? (
                <div className="space-y-1">
                    {choices?.map((choice: any, i: number) => (
                        <label key={i} className="flex items-center gap-2 text-sm">
                            <input
                                type={isMultiSelect ? 'checkbox' : 'radio'}
                                name={id}
                                value={choice.value}
                                onChange={(e) => ctx.setInput(id, e.target.value)}
                            />
                            {choice.title}
                        </label>
                    ))}
                </div>
            ) : (
                <select
                    className="w-full px-3 py-2 border rounded text-sm"
                    onChange={(e) => ctx.setInput(id, e.target.value)}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {choices?.map((choice: any, i: number) => (
                        <option key={i} value={choice.value}>{choice.title}</option>
                    ))}
                </select>
            )}
        </div>
    ),

    'Action.Submit': ({ title, data, ctx }) => (
        <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm"
            onClick={() => ctx.onAction({ type: 'Action.Submit', data }, ctx.inputs)}
        >
            {title || 'Submit'}
        </button>
    ),

    'Action.OpenUrl': ({ title, url }) => (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border rounded text-sm hover:bg-muted"
        >
            {title || 'Open'}
        </a>
    ),

    'Action.Execute': ({ title, verb, data, ctx }) => (
        <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm"
            onClick={() => ctx.onAction({ type: 'Action.Execute', verb, data }, ctx.inputs)}
        >
            {title || 'Execute'}
        </button>
    ),
};

function AdaptiveElement({ element, ctx }: { element: AdaptiveCardElement; ctx: RenderContext }) {
    const Widget = widgets[element.type];
    if (!Widget) {
        console.warn(`Unknown Adaptive Card element: ${element.type}`);
        return null;
    }
    return <Widget {...element} ctx={ctx} />;
}

export function AdaptiveCardRenderer({
    card,
    onAction,
}: {
    card: AdaptiveCard;
    onAction?: (action: AdaptiveCardElement, data: Record<string, unknown>) => void;
}) {
    const [inputs, setInputs] = React.useState<Record<string, unknown>>({});

    const ctx: RenderContext = {
        onAction: onAction || (() => { }),
        inputs,
        setInput: (id, value) => setInputs((prev) => ({ ...prev, [id]: value })),
    };

    return (
        <div className="rounded-lg border p-4 space-y-3 max-w-md">
            {card.body?.map((element, i) => (
                <AdaptiveElement key={i} element={element} ctx={ctx} />
            ))}
            {card.actions && card.actions.length > 0 && (
                <div className="flex gap-2 pt-2 border-t">
                    {card.actions.map((action, i) => (
                        <AdaptiveElement key={i} element={action} ctx={ctx} />
                    ))}
                </div>
            )}
        </div>
    );
}