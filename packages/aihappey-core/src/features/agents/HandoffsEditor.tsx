import { useMemo, useState } from "react";

export type Handoff = [string, string[]] | [string[], string];

interface HandoffsEditorProps {
    theme: any;
    t: (key: string, opts?: any) => string;
    agents: { id: string; name: string }[];
    handoffs: Handoff[];
    setHandoffs: (value: Handoff[]) => void;
}

export const HandoffsEditor = ({
    theme,
    t,
    agents,
    handoffs,
    setHandoffs,
}: HandoffsEditorProps) => {
    const SelectComponent = theme.Select || "select";

    const [left, setLeft] = useState<string[]>([]);
    const [right, setRight] = useState<string[]>([]);

    const agentsById = useMemo(
        () =>
            Object.fromEntries(agents.map((a) => [a.id, a.name] as const)),
        [agents]
    );

    const resetDraft = () => {
        setLeft([]);
        setRight([]);
    };

    const removeHandoff = (index: number) => {
        const copy = [...handoffs];
        copy.splice(index, 1);
        setHandoffs(copy);
    };

    const leftCount = left.length;
    const rightCount = right.length;
    const leftIsMulti = leftCount > 1;
    const rightIsMulti = rightCount > 1;

    // valid if EXACTLY one side is multi, and the other is exactly 1
    const isValid =
        (leftCount === 1 && rightCount >= 2) ||
        (leftCount >= 2 && rightCount === 1);

    const addHandoff = () => {
        if (!isValid) return;

        let newHandoff: Handoff;

        if (leftCount === 1 && rightCount >= 2) {
            // [single, many]
            newHandoff = [left[0], right];
        } else {
            // [many, single]
            newHandoff = [left, right[0]];
        }

        setHandoffs([...handoffs, newHandoff]);
        resetDraft();
    };

    const renderSide = (side: string | string[]) => {
        if (Array.isArray(side)) {
            return side.map((id) => agentsById[id] ?? id).join(", ");
        }
        return agentsById[side] ?? side;
    };
    const handleLeftToggle = (value: string) => {
        setLeft((prev) => {
            // If the RIGHT side is multi, LEFT must be single → override instead of toggle
            if (rightIsMulti) {
                return [value];
            }

            // Normal toggle
            if (prev.includes(value)) {
                return prev.filter((x) => x !== value);
            } else {
                return [...prev, value];
            }
        });
    };

    const handleRightToggle = (value: string) => {
        setRight((prev) => {
            // If the LEFT side is multi, RIGHT must be single → override instead of toggle
            if (leftIsMulti) {
                return [value];
            }

            // Normal toggle
            if (prev.includes(value)) {
                return prev.filter((x) => x !== value);
            } else {
                return [...prev, value];
            }
        });
    };


    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {/* EXISTING LIST */}
            {handoffs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {handoffs.map((handoff, index) => {
                        const leftVal = handoff[0];
                        const rightVal = handoff[1];

                        return (
                            <div
                                key={index}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <div>
                                    {Array.isArray(leftVal)
                                        ? `[${renderSide(leftVal)}]`
                                        : renderSide(leftVal)}{" "}
                                    ➜{" "}
                                    {Array.isArray(rightVal)
                                        ? `[${renderSide(rightVal)}]`
                                        : renderSide(rightVal)}
                                </div>

                                <theme.Button
                                    icon="delete"
                                    size="small"
                                    variant="transparant"
                                    onClick={() => removeHandoff(index)}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* EDITOR */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* TWO SELECTS IN ONE ROW */}
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    {/* LEFT SELECT */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <SelectComponent
                            values={left}
                            label={t("workflows.handoffs.from")}
                            multiselect={!rightIsMulti} // if right is multi, left must be single
                            valueTitle={left.map((id) => agentsById[id]).join(", ")}
                            size="small"
                            style={{ width: "100%" }}
                            onChange={handleLeftToggle}
                            aria-label="Handoff left side"
                        >
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.name}
                                </option>
                            ))}
                        </SelectComponent>
                    </div>

                    <div style={{ paddingTop: 18 }}>➜</div>

                    {/* RIGHT SELECT */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <SelectComponent
                            values={right}
                            label={t("workflows.handoffs.to")}
                            multiselect={!leftIsMulti} // if left is multi, right must be single
                            valueTitle={right.map((id) => agentsById[id]).join(", ")}
                            size="small"
                            style={{ width: "100%" }}
                            onChange={handleRightToggle}
                            aria-label="Handoff right side"
                        >
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.name}
                                </option>
                            ))}
                        </SelectComponent>
                    </div>
                </div>

                {/* ADD BUTTON */}
                <div style={{
                    display: "flex",
                    justifyContent: "flex-end"
                }}>
                    <theme.Button
                        size="small"
                        icon="add"
                        variant="transparent"
                        disabled={!isValid}
                        onClick={addHandoff}
                    >
                    </theme.Button>
                </div>
            </div>
        </div>
    );
};
