export type WizardStepHeaderProps = {
  title: string;
  description?: string;
  step?: number;
  totalSteps?: number;
};

export const WizardStepHeader = ({
  title,
  description,
  step,
  totalSteps,
}: WizardStepHeaderProps) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h4 style={{ margin: 0 }}>{title}</h4>
        {step && totalSteps ? (
          <span style={{ fontSize: 12, color: "#888" }}>{step} / {totalSteps}</span>
        ) : null}
      </div>
      {description ? <p style={{ margin: 0, color: "#666" }}>{description}</p> : null}
    </div>
  );
};
