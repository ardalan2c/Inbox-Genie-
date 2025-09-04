import { DarkCard } from '../../../components/ui/card'

export default function SettingsIndex() {
  return (
    <div className="space-y-6">
      <h1 className="font-sora text-2xl">Settings</h1>
      <DarkCard className="p-5">
        <div className="text-sm text-slate-300">Settings sections: business profile, integrations, compliance, billing, team, whitelabel.</div>
      </DarkCard>
    </div>
  )
}

