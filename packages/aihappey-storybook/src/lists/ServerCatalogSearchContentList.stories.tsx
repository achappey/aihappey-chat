import React, { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { McpRegistryServerResponse } from "aihappey-types";
import {
    AuthorBadges,
    RegistryServerCard,
    ServerCatalogSearchContentList,
    type ServerCatalogRenderItemArgs,
    type ServerCatalogTabKey,
} from "aihappey-components";

const demoServers: McpRegistryServerResponse[] = [
    {
        server: {
            name: "example.com/weather",
            title: "Weather",
            description: "Fetch weather for a given location",
            version: "1.0.0",
            remotes: [{ type: "streamable-http", url: "https://api.example.com/mcp" }],
        },
        _meta: {
            registry: {
                authors: [{ name: "Alice", email: "alice@example.com" }],
            },
        },
    },
    {
        server: {
            // host equals the reversed base domain for baseDomain="example.com"
            // ("com.example") to exercise the domain matching logic.
            name: "com.example/notes",
            title: "Notes",
            description: "Create and search personal notes",
            version: "2.1.0",
            remotes: [{ type: "streamable-http", url: "https://notes.example.com/mcp" }],
        },
        _meta: {
            registry: {
                authors: [
                    { name: "Alice", email: "alice@example.com" },
                    { name: "Bob", email: "bob@other.org" },
                ],
            },
        },
    },
    {
        server: {
            name: "other.org/search",
            title: "Search",
            description: "Full-text search across datasets",
            version: "0.9.0",
            remotes: [{ type: "streamable-http", url: "https://mcp.other.org/search" }],
        },
        _meta: {
            registry: {
                authors: [{ name: "Charlie", email: "charlie@other.org" }],
            },
        },
    },
];

type ControlledProps = Omit<
    React.ComponentProps<typeof ServerCatalogSearchContentList>,
    | "search"
    | "onSearchChange"
    | "activeTab"
    | "onTabChange"
    | "showBaseDomain"
    | "onToggleBaseDomain"
> & {
    initialSearch?: string;
    initialTab?: ServerCatalogTabKey;
    initialShowBaseDomain?: boolean;
};

const Controlled: React.FC<ControlledProps> = ({
    initialSearch = "",
    initialTab = "all",
    initialShowBaseDomain = false,
    ...args
}) => {
    const [search, setSearch] = useState(initialSearch);
    const [activeTab, setActiveTab] = useState<ServerCatalogTabKey>(initialTab);
    const [showBaseDomain, setShowBaseDomain] = useState(initialShowBaseDomain);

    return (
        <div style={{ height: 520, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, padding: 12 }}>
            <ServerCatalogSearchContentList
                {...args}
                search={search}
                onSearchChange={setSearch}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                showBaseDomain={showBaseDomain}
                onToggleBaseDomain={() => setShowBaseDomain((v) => !v)}
            />
        </div>
    );
};

const meta = {
    title: "Lists/ServerCatalogSearchContentList",
    component: ServerCatalogSearchContentList,
    args: {
        servers: demoServers,
        installedServerKeys: ["example.com/weather", "https://notes.example.com/mcp"],
        recentlyUsedUrls: new Set(["https://api.example.com/mcp"]),
        ownerEmail: "alice@example.com",

        enableBaseDomainToggle: true,
        baseDomain: "example.com",

        quickSearches: ["weather", "notes", "search"],

        renderItem: (args: ServerCatalogRenderItemArgs) => <RegistryServerCard
            serverItem={args.server}
            renderDescription={() => <AuthorBadges authors={args.ownerNames} />}
        />,
    },
    argTypes: {
        servers: { control: "object" },
        installedServerKeys: { control: "object" },
        // Storybook controls do not serialize Set well.
        recentlyUsedUrls: { control: false },
        ownerEmail: { control: "text" },
        quickSearches: { control: "object" },

        // Controlled by wrapper.
        search: { control: false },
        onSearchChange: { control: false },
        activeTab: { control: false },
        onTabChange: { control: false },
        showBaseDomain: { control: false },
        onToggleBaseDomain: { control: false },

        renderItem: { control: false },
    },
} satisfies Meta<typeof ServerCatalogSearchContentList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    args: {
        initialTab: "all",
        initialSearch: "",
        initialShowBaseDomain: false,
    } as any,
    render: (args) => <Controlled {...(args as any)} />,
};

export const RecentTab: Story = {
    args: {
        initialTab: "recent",
    } as any,
    render: (args) => <Controlled {...(args as any)} />,
};

export const MyTab: Story = {
    args: {
        initialTab: "my",
        ownerEmail: "alice@example.com",
    } as any,
    render: (args) => <Controlled {...(args as any)} />,
};

export const DomainFiltered: Story = {
    args: {
        initialTab: "all",
        initialShowBaseDomain: true,
    } as any,
    render: (args) => <Controlled {...(args as any)} />,
};

export const Empty: Story = {
    args: {
        servers: [],
        initialTab: "all",
    } as any,
    render: (args) => <Controlled {...(args as any)} />,
};

