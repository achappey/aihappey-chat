import { SYSTEM_ROLE, type UIMessage } from "aihappey-types";
import { ServerItem, type Resource, type ResourceTemplate } from "aihappey-state";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import { chatAppInstructions } from "../../../runtime/chat-app/chatAppInstructions";
import { encode } from '@toon-format/toon'

const getSystemInfo = (appName?: string) => {
    const now = new Date();
    return ({
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
        language: navigator.language,
        screen: {
            width: window.screen.width,
            height: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            pixelDepth: window.screen.pixelDepth,
            colorDepth: window.screen.colorDepth,
        },
        window: {
            origin: window.location.origin,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        utcNow: now.toISOString(),
        localNow: now.toLocaleString(),
        appName
    })
};

const buildAnnotations = (source: any, keys: any) => {
    if (!source?.annotations) return undefined;
    const result: any = {};
    keys.forEach((k: any) => {
        if (source.annotations[k] !== undefined) result[k] = source.annotations[k];
    });

    return Object.keys(result).length ? result : undefined;
}

export const getRepositoryUrl = (repo: any) => {
    return repo?.url + repo?.subfolder;
}

export function getDomain(url?: string): string | null {
    if (!url) return null;
    try {
        const { hostname } = new URL(url);
        return hostname.replace(/^www\./, ""); // optional cleanup
    } catch {
        return null; // invalid URL
    }
}

const isForAssistant = (a: any) =>
    !a?.annotations?.audience?.length ||
    a.annotations.audience.includes("assistant");

type AvailableSkill = {
    skillId: string;
    name: string;
    description: string;
};


export const buildSystemMessage = (
    mcpServers: Record<string, any>,
    allServers: Record<string, ServerItem>,
    chatInstructions?: string,
    accountLocation?: any,
    appName?: string,
    account?: {
        id?: string, username?: string, name?: string, tenantId?: string,
        preferredLanguage?: string,
        darkMode?: boolean
    },
    availableSkills: AvailableSkill[] = []
): UIMessage => {

    var connects = Object.keys(allServers).filter(a => !allServers[a].config.disabled)

    const mcpSystemBlocks = Object.keys(mcpServers)
        .filter(srv => connects.includes(srv))
        .map(srv => {
            const { instructions, resources, resourceTemplates, version } = mcpServers[srv];
            const { config, registry } = allServers[srv];
            const res = resources.filter((a: any) => isForAssistant(a)) ?? [];
            const resTemplates = resourceTemplates.filter((a: any) => isForAssistant(a)) ?? [];
            const instr = instructions?.trim();

            return {
                modelContextProtocolServer: {
                    name: version?.name,
                    version: version?.version,
                    mcpServerUrl: config?.url,
                    ...(version?.title && { title: version.title }),
                    ...(version?.websiteUrl && { websiteUrl: version.websiteUrl }),
                    ...(registry?.server?.repository && { repository: registry.server.repository }),
                    ...(registry?._meta && { meta: registry._meta }),
                },

                resources:
                    res.length > 0
                        ? res.map((r: any) => ({
                            name: r.name,
                            uri: r.uri,
                            description: r.description,
                            mimeType: r.mimeType,
                            ...(r.size ? { size: r.size } : {}),
                            ...(buildAnnotations(r, ["priority", "lastModified"]) && {
                                annotations: buildAnnotations(r, ["priority", "lastModified"]),
                            }),
                        }))
                        : undefined,

                resourceTemplates:
                    resTemplates.length > 0
                        ? resTemplates.map((rt: any) => ({
                            name: rt.name,
                            uriTemplate: rt.uriTemplate,
                            description: rt.description,
                            mimeType: rt.mimeType,
                            ...(buildAnnotations(rt, ["priority"]) && {
                                annotations: buildAnnotations(rt, ["priority"]),
                            }),
                        }))
                        : undefined,

                ...(instr && { instructions: instr }),
            };
        })
        .filter(Boolean);

    // ---- Build system message blocks ----

    const parts: any[] = [];

    // MCP SERVER BLOCKS
    for (const block of mcpSystemBlocks) {
        parts.push({
            type: "text",
            text: JSON.stringify(block)
            //text: encode(block)
        });
    }

    if (availableSkills.length > 0) {
        parts.push({
            type: "text",
            /* text: encode({
                 availableSkills: {
                     activationTool: "activate_skill",
                     resourceTool: "read_skill_resource",
                     instructions:
                         "The following skills provide specialized instructions for specific tasks. When a task matches a skill description, call activate_skill with the exact skill_id to load its instructions. After activation, use read_skill_resource with the same skill_id and a relative path when the instructions reference bundled files.",
                     skills: availableSkills.map((skill) => ({
                         id: skill.skillId,
                         skill_id: skill.skillId,
                         name: skill.name,
                         description: skill.description,
                     })),
                 },
             })*/
            text: JSON.stringify({
                availableSkills: {
                    activationTool: "activate_skill",
                    resourceTool: "read_skill_resource",
                    instructions:
                        "The following skills provide specialized instructions for specific tasks. When a task matches a skill description, call activate_skill with the exact skill_id to load its instructions. After activation, use read_skill_resource with the same skill_id and a relative path when the instructions reference bundled files.",
                    skills: availableSkills.map((skill) => ({
                        id: skill.skillId,
                        skill_id: skill.skillId,
                        name: skill.name,
                        description: skill.description,
                    })),
                },
            })
        });
    }

    const instructions = chatAppInstructions()
    parts.push({
        type: "text",
        /* text: encode({
             chatBotInstructions: instructions?.replaceAll("\\n", "\n")
         })*/
        text: JSON.stringify({
            chatBotInstructions: instructions?.replaceAll("\\n", "\n")
        })
    });

    // System info block
    parts.push({
        type: "text",
        /*     text: encode({
                 systemInformation: getSystemInfo(appName)
             })*/
        text: JSON.stringify({
            systemInformation: getSystemInfo(appName)
        })
    });

    // Account block
    if (account) {
        parts.push({
            type: "text",
            /*  text: encode({
                  ...account,
                  ...(accountLocation ? { location: accountLocation } : {}),
              })*/
            text: JSON.stringify({
                ...account,
                ...(accountLocation ? { location: accountLocation } : {}),
            })
        });
    }

    // Chat instruction single block
    if (chatInstructions?.trim()) {
        parts.push({
            type: "text",
            text: chatInstructions.trim()
        });
    }

    return {
        id: crypto.randomUUID(),
        role: SYSTEM_ROLE,
        parts,
        metadata: {
            timestamp: new Date().toISOString(),
            author: SYSTEM_ROLE
        }
    };
};

