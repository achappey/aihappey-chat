import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react';
import { z } from 'zod';

export const ADAPTIVE_CARDS_CATALOG_ID = 'adaptive-cards';
export const ADAPTIVE_CARDS_CATALOG_LABEL = 'Adaptive Cards';

// Common Adaptive Cards properties
const Spacing = z.enum(['none', 'small', 'default', 'medium', 'large', 'extraLarge', 'padding']);
const HorizontalAlignment = z.enum(['left', 'center', 'right']);
const VerticalAlignment = z.enum(['top', 'center', 'bottom']);
const FontSize = z.enum(['small', 'default', 'medium', 'large', 'extraLarge']);
const FontWeight = z.enum(['lighter', 'default', 'bolder']);
const ImageSize = z.enum(['auto', 'stretch', 'small', 'medium', 'large']);
const ImageStyle = z.enum(['default', 'person']);

// Base element properties shared by most elements
const BaseElement = {
  id: z.string().optional(),
  isVisible: z.boolean().optional(),
  separator: z.boolean().optional(),
  spacing: Spacing.optional(),
};

export const adaptiveCardsComponentDefinitions = {
    // Root card
    AdaptiveCard: {
      description: 'Root Adaptive Card container',
      props: z.object({
        version: z.string(),
        body: z.array(z.unknown()).optional(),
        actions: z.array(z.unknown()).optional(),
        fallbackText: z.string().optional(),
        minHeight: z.string().optional(),
        rtl: z.boolean().optional(),
        verticalContentAlignment: VerticalAlignment.optional(),
      }),
    },

    // Elements
    TextBlock: {
      description: 'Displays text with formatting options',
      props: z.object({
        ...BaseElement,
        text: z.string(),
        color: z.enum(['default', 'dark', 'light', 'accent', 'good', 'warning', 'attention']).optional(),
        fontType: z.enum(['default', 'monospace']).optional(),
        horizontalAlignment: HorizontalAlignment.optional(),
        isSubtle: z.boolean().optional(),
        maxLines: z.number().optional(),
        size: FontSize.optional(),
        weight: FontWeight.optional(),
        wrap: z.boolean().optional(),
      }),
    },

    Image: {
      description: 'Displays an image',
      props: z.object({
        ...BaseElement,
        url: z.string(),
        altText: z.string().optional(),
        backgroundColor: z.string().optional(),
        height: z.string().optional(),
        width: z.string().optional(),
        horizontalAlignment: HorizontalAlignment.optional(),
        size: ImageSize.optional(),
        style: ImageStyle.optional(),
      }),
    },

    Container: {
      description: 'Groups elements together',
      props: z.object({
        ...BaseElement,
        items: z.array(z.unknown()),
        style: z.enum(['default', 'emphasis', 'good', 'attention', 'warning', 'accent']).optional(),
        verticalContentAlignment: VerticalAlignment.optional(),
        bleed: z.boolean().optional(),
        minHeight: z.string().optional(),
      }),
    },

    ColumnSet: {
      description: 'Arranges columns horizontally',
      props: z.object({
        ...BaseElement,
        columns: z.array(z.unknown()),
        horizontalAlignment: HorizontalAlignment.optional(),
        minHeight: z.string().optional(),
      }),
    },

    Column: {
      description: 'A column within a ColumnSet',
      props: z.object({
        ...BaseElement,
        items: z.array(z.unknown()).optional(),
        width: z.union([z.string(), z.number()]).optional(),
        style: z.enum(['default', 'emphasis', 'good', 'attention', 'warning', 'accent']).optional(),
        verticalContentAlignment: VerticalAlignment.optional(),
      }),
    },

    FactSet: {
      description: 'Displays a series of facts as key/value pairs',
      props: z.object({
        ...BaseElement,
        facts: z.array(z.object({
          title: z.string(),
          value: z.string(),
        })),
      }),
    },

    ImageSet: {
      description: 'Displays a collection of images',
      props: z.object({
        ...BaseElement,
        images: z.array(z.object({
          type: z.literal('Image'),
          url: z.string(),
          altText: z.string().optional(),
        })),
        imageSize: ImageSize.optional(),
      }),
    },

    ActionSet: {
      description: 'Displays a set of actions',
      props: z.object({
        ...BaseElement,
        actions: z.array(z.unknown()),
      }),
    },

    RichTextBlock: {
      description: 'Rich text with inline formatting',
      props: z.object({
        ...BaseElement,
        inlines: z.array(z.unknown()),
        horizontalAlignment: HorizontalAlignment.optional(),
      }),
    },

    // Inputs
    'Input.Text': {
      description: 'Text input field',
      props: z.object({
        ...BaseElement,
        id: z.string(),
        isMultiline: z.boolean().optional(),
        maxLength: z.number().optional(),
        placeholder: z.string().optional(),
        label: z.string().optional(),
        value: z.string().optional(),
        style: z.enum(['text', 'tel', 'url', 'email', 'password']).optional(),
        isRequired: z.boolean().optional(),
        errorMessage: z.string().optional(),
      }),
    },

    'Input.Number': {
      description: 'Number input field',
      props: z.object({
        ...BaseElement,
        id: z.string(),
        max: z.number().optional(),
        min: z.number().optional(),
        placeholder: z.string().optional(),
        label: z.string().optional(),
        value: z.number().optional(),
        isRequired: z.boolean().optional(),
        errorMessage: z.string().optional(),
      }),
    },

    'Input.Date': {
      description: 'Date picker input',
      props: z.object({
        ...BaseElement,
        id: z.string(),
        max: z.string().optional(),
        min: z.string().optional(),
        placeholder: z.string().optional(),
        label: z.string().optional(),
        value: z.string().optional(),
        isRequired: z.boolean().optional(),
      }),
    },

    'Input.Time': {
      description: 'Time picker input',
      props: z.object({
        ...BaseElement,
        id: z.string(),
        max: z.string().optional(),
        min: z.string().optional(),
        placeholder: z.string().optional(),
        label: z.string().optional(),
        value: z.string().optional(),
        isRequired: z.boolean().optional(),
      }),
    },

    'Input.Toggle': {
      description: 'Toggle/checkbox input',
      props: z.object({
        ...BaseElement,
        id: z.string(),
        title: z.string(),
        label: z.string().optional(),
        value: z.string().optional(),
        valueOff: z.string().optional(),
        valueOn: z.string().optional(),
        isRequired: z.boolean().optional(),
      }),
    },

    'Input.ChoiceSet': {
      description: 'Dropdown or radio/checkbox group',
      props: z.object({
        ...BaseElement,
        id: z.string(),
        choices: z.array(z.object({
          title: z.string(),
          value: z.string(),
        })),
        isMultiSelect: z.boolean().optional(),
        style: z.enum(['compact', 'expanded']).optional(),
        label: z.string().optional(),
        value: z.string().optional(),
        placeholder: z.string().optional(),
        isRequired: z.boolean().optional(),
      }),
    },

    // Actions
    'Action.OpenUrl': {
      description: 'Opens a URL',
      props: z.object({
        title: z.string().optional(),
        url: z.string(),
        iconUrl: z.string().optional(),
      }),
    },

    'Action.Submit': {
      description: 'Submits input data',
      props: z.object({
        title: z.string().optional(),
        data: z.unknown().optional(),
        iconUrl: z.string().optional(),
      }),
    },

    'Action.ShowCard': {
      description: 'Shows a card inline',
      props: z.object({
        title: z.string().optional(),
        card: z.unknown(),
        iconUrl: z.string().optional(),
      }),
    },

    'Action.ToggleVisibility': {
      description: 'Toggles visibility of elements',
      props: z.object({
        title: z.string().optional(),
        targetElements: z.array(z.union([
          z.string(),
          z.object({ elementId: z.string(), isVisible: z.boolean().optional() }),
        ])),
        iconUrl: z.string().optional(),
      }),
    },

    'Action.Execute': {
      description: 'Universal action for bots',
      props: z.object({
        title: z.string().optional(),
        verb: z.string().optional(),
        data: z.unknown().optional(),
        iconUrl: z.string().optional(),
      }),
    },
  };

export const adaptiveCardsStaticActionDefinitions = {};

export const adaptiveCardsCatalog = defineCatalog(schema, {
  components: adaptiveCardsComponentDefinitions,
  actions: adaptiveCardsStaticActionDefinitions,
});

export const adaptiveCardsDefaultCatalogDefinitions = [
  {
    name: ADAPTIVE_CARDS_CATALOG_ID,
    manageable: false,
    components: adaptiveCardsComponentDefinitions,
    actions: adaptiveCardsStaticActionDefinitions,
    validationFunctions: {},
  },
];
