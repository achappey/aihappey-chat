import { useTheme } from 'aihappey-components';
import { useAppStore } from 'aihappey-state';
import { AgentSelect } from '../agents/AgentSelect';
import { ModelSelect } from '../models/ModelSelect';

export function LiveClientTargetSelect({ value, onChange }: {
  value?: { kind: 'agent' | 'model'; id: string };
  onChange: (value: { kind: 'agent' | 'model'; id: string }) => void;
}) {
  const theme = useTheme();
  const agents = useAppStore(s => s.agents);
  const remoteAgents = useAppStore(s => s.remoteAgentModels);
  const models = useAppStore(s => s.models);
  const kind = value?.kind ?? 'model';
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <theme.Select label="Client execution target" values={[kind]} valueTitle={kind} options={[{ value: 'model', label: 'Chat model' }, { value: 'agent', label: 'Agent' }]} onChange={(kind: string) => onChange({ kind: kind as 'agent' | 'model', id: '' })}>
      <option value="model">Chat model</option><option value="agent">Agent</option>
    </theme.Select>
    {kind === 'agent' ? <AgentSelect localAgents={agents ?? []} remoteAgentModels={remoteAgents ?? []} values={value?.id ? [value.id] : []} onChange={id => onChange({ kind, id })} />
      : <ModelSelect models={models ?? []} modelTypes={['language']} value={value?.id ?? ''} autoSelectFallback={false} onChange={id => onChange({ kind, id })} />}
  </div>;
}
