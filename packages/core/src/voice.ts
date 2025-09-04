import type { BusinessProfile } from './types';

export interface VoiceProvider {
  configureAgent(profile: BusinessProfile): Promise<{ agentId: string }>;
  startCall(args: { to: string; from: string; agentId: string; context?: any }): Promise<{ callId: string }>;
  endCall(callId: string): Promise<void>;
}

export class RetellProvider implements VoiceProvider {
  private apiKey: string;
  private baseUrl: string;
  private webhookUrl: string;

  constructor(opts: { apiKey?: string; baseUrl?: string; webhookUrl: string }) {
    if (!opts.apiKey) throw new Error('RETELL_API_KEY missing');
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? 'https://api.retellai.com';
    this.webhookUrl = opts.webhookUrl;
  }

  async configureAgent(profile: BusinessProfile): Promise<{ agentId: string }> {
    const agentId = 'agent_' + Buffer.from(profile.name).toString('hex').slice(0, 8);
    return { agentId };
  }

  async startCall(args: { to: string; from: string; agentId: string; context?: any }): Promise<{ callId: string }> {
    const res = await fetch(`${this.baseUrl}/v1/phone-calls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to_number: args.to,
        from_number: args.from,
        agent_id: args.agentId,
        metadata: args.context ?? {},
        webhook_url: this.webhookUrl
      })
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Retell startCall failed: ${res.status} ${body}`);
    }
    const data = await res.json();
    return { callId: data.id ?? data.call_id ?? 'call_' + Date.now() };
  }

  async endCall(callId: string): Promise<void> {
    await fetch(`${this.baseUrl}/v1/phone-calls/${callId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
  }
}

