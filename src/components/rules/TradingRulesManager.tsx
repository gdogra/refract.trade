'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Shield, AlertTriangle, Ban } from 'lucide-react'
import { TradingRulesEngine, TradingRule } from '@/lib/rules/tradingRulesEngine'

export function TradingRulesManager({ userId }: { userId: string }) {
  const [rules, setRules] = useState<TradingRule[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRule, setEditingRule] = useState<TradingRule | null>(null)

  useEffect(() => {
    loadRules()
  }, [userId])

  const loadRules = async () => {
    const userRules = await TradingRulesEngine.getUserRules(userId)
    setRules(userRules)
  }

  const handleCreateRule = async (ruleData: any) => {
    await TradingRulesEngine.createRule(
      userId,
      ruleData.name,
      ruleData.ruleType,
      ruleData.condition,
      ruleData.action,
      ruleData.priority
    )
    await loadRules()
    setShowCreateForm(false)
  }

  const handleUpdateRule = async (ruleId: string, updates: any) => {
    await TradingRulesEngine.updateRule(ruleId, updates)
    await loadRules()
    setEditingRule(null)
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Delete this rule?')) {
      await TradingRulesEngine.deleteRule(ruleId)
      await loadRules()
    }
  }

  const handleToggleRule = async (rule: TradingRule) => {
    await TradingRulesEngine.updateRule(rule.id, { isActive: !rule.isActive })
    await loadRules()
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'block': return <Ban className="w-4 h-4 text-red-500" />
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default: return <Shield className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Trading Rules</h2>
          <p className="text-gray-600">Customize your trading guardrails and safety checks</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 rounded-lg border-2 transition-colors ${
              rule.isActive
                ? rule.action === 'block'
                  ? 'border-red-200 bg-red-50'
                  : 'border-yellow-200 bg-yellow-50'
                : 'border-gray-200 bg-gray-50 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getActionIcon(rule.action)}
                <div>
                  <h3 className="font-semibold">{rule.name}</h3>
                  <p className="text-sm text-gray-600">
                    {rule.ruleType.replace('_', ' ')} · {rule.action}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    onChange={() => handleToggleRule(rule)}
                    className="rounded"
                  />
                  <span className="text-sm">Active</span>
                </label>
                
                <button
                  onClick={() => setEditingRule(rule)}
                  className="p-2 hover:bg-white rounded-md"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 hover:bg-white rounded-md text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 p-3 bg-white rounded-md">
              <pre className="text-xs text-gray-700 overflow-x-auto">
                {JSON.stringify(rule.condition, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {(rules??.length || 0) === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No rules configured</h3>
          <p className="text-gray-600 mb-4">Add trading rules to protect your account</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Rule
          </button>
        </div>
      )}

      {showCreateForm && (
        <RuleCreateForm
          onSave={handleCreateRule}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingRule && (
        <RuleEditForm
          rule={editingRule}
          onSave={(updates) => handleUpdateRule(editingRule.id, updates)}
          onCancel={() => setEditingRule(null)}
        />
      )}
    </div>
  )
}

function RuleCreateForm({ 
  onSave, 
  onCancel 
}: { 
  onSave: (data: any) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    ruleType: 'position_size',
    action: 'warn' as 'block' | 'warn' | 'require_reason',
    priority: 0,
    condition: {}
  })

  const presetRules = TradingRulesEngine.getPresetRules()

  const handlePresetSelect = (preset: any) => {
    setFormData({
      name: preset.name,
      ruleType: preset.ruleType,
      action: preset.action,
      priority: 0,
      condition: preset.condition
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Create Trading Rule</h3>
        
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Quick Start - Preset Rules</h4>
          <div className="grid gap-2 max-h-40 overflow-y-auto">
            {presetRules.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetSelect(preset)}
                className="text-left p-2 border rounded hover:bg-gray-50"
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-xs text-gray-600">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Rule Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rule Type</label>
              <select
                value={formData.ruleType}
                onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="position_size">Position Size</option>
                <option value="timing">Timing</option>
                <option value="frequency">Frequency</option>
                <option value="symbol">Symbol</option>
                <option value="strategy">Strategy</option>
                <option value="dte">Days to Expiry</option>
                <option value="iv_environment">IV Environment</option>
                <option value="profit_loss">Profit/Loss</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Action</label>
              <select
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="warn">Warn</option>
                <option value="block">Block</option>
                <option value="require_reason">Require Reason</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Condition (JSON)</label>
            <textarea
              value={JSON.stringify(formData.condition, null, 2)}
              onChange={(e) => {
                try {
                  setFormData({ ...formData, condition: JSON.parse(e.target.value) })
                } catch {}
              }}
              className="w-full p-2 border rounded font-mono text-sm h-32"
              placeholder='{"maxPositionSizePercent": 5}'
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RuleEditForm({ 
  rule, 
  onSave, 
  onCancel 
}: { 
  rule: TradingRule
  onSave: (data: any) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    name: rule.name,
    condition: rule.condition,
    action: rule.action,
    priority: rule.priority,
    isActive: rule.isActive
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Edit Rule: {rule.name}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Rule Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Action</label>
              <select
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="warn">Warn</option>
                <option value="block">Block</option>
                <option value="require_reason">Require Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full p-2 border rounded"
                min="0"
                max="10"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Rule is active</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Condition (JSON)</label>
            <textarea
              value={JSON.stringify(formData.condition, null, 2)}
              onChange={(e) => {
                try {
                  setFormData({ ...formData, condition: JSON.parse(e.target.value) })
                } catch {}
              }}
              className="w-full p-2 border rounded font-mono text-sm h-32"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}