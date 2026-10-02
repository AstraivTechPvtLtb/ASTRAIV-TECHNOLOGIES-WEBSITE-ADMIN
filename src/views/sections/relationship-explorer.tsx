'use client';

/**
 * @file admin/src/views/sections/relationship-explorer.tsx
 * @description [VIEW] Bidirectional Relationship Explorer and Graph Connection Manager.
 */

import { useState } from 'react';
import {
  linkServiceToTechnology,
  unlinkServiceFromTechnology,
} from '@/controllers/relationships.controller';
import type {
  RelationshipGraphData,
  EntitySummary,
} from '@/controllers/relationships.controller';
import {
  Network,
  Cpu,
  Sparkles,
  Building2,
  Terminal,
  FolderKanban,
  FileText,
  Link2,
  Unlink,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

interface RelationshipExplorerProps {
  initialGraph: RelationshipGraphData;
}

export function RelationshipExplorer({ initialGraph }: RelationshipExplorerProps) {
  const [graph, setGraph] = useState<RelationshipGraphData>(initialGraph);
  const [selectedEntityId, setSelectedEntityId] = useState<string>(graph.entities[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const selectedEntity = graph.entities.find(e => e.id === selectedEntityId);

  // Find all outbound and inbound connections for the selected entity
  const outgoing = graph.connections.filter(c => c.fromId === selectedEntityId);
  const incoming = graph.connections.filter(c => c.toId === selectedEntityId);

  const filteredEntities = graph.entities.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLinkTech = async (serviceId: string, technologyId: string) => {
    setIsLinking(true);
    try {
      const res = await linkServiceToTechnology(serviceId, technologyId);
      if (res.success) {
        setGraph(prev => ({
          ...prev,
          connections: [
            ...prev.connections,
            { fromId: serviceId, fromType: 'service', toId: technologyId, toType: 'technology' }
          ]
        }));
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkTech = async (serviceId: string, technologyId: string) => {
    try {
      const res = await unlinkServiceFromTechnology(serviceId, technologyId);
      if (res.success) {
        setGraph(prev => ({
          ...prev,
          connections: prev.connections.filter(c => !(c.fromId === serviceId && c.toId === technologyId))
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'service': return Cpu;
      case 'solution': return Sparkles;
      case 'industry': return Building2;
      case 'technology': return Terminal;
      case 'project': return FolderKanban;
      case 'article':
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entity List Selector */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white block">Focus Entity</span>
            <span className="text-[11px] text-slate-400">Select any entity to inspect connected dependencies</span>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter entities..."
              className="bg-slate-950 border-slate-800 text-xs pl-8"
            />
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto pr-1">
            {filteredEntities.map((ent) => {
              const Icon = getEntityIcon(ent.type);
              const isSelected = ent.id === selectedEntityId;
              const connCount = graph.connections.filter(c => c.fromId === ent.id || c.toId === ent.id).length;

              return (
                <button
                  key={ent.id}
                  onClick={() => setSelectedEntityId(ent.id)}
                  className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-colors my-0.5 ${isSelected ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800/60 text-slate-300'}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs truncate">{ent.title}</span>
                  </div>

                  <Badge variant="outline" className={`text-[9px] font-mono shrink-0 ml-2 ${isSelected ? 'border-white/40 text-white' : 'border-slate-700 text-slate-400'}`}>
                    {connCount} links
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Focused Entity Graph & Linked Connections */}
        <div className="lg:col-span-8 space-y-4">
          {selectedEntity ? (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
              {/* Focused Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] uppercase font-mono">
                      {selectedEntity.type}
                    </Badge>
                    <h2 className="text-base font-bold text-white tracking-tight">{selectedEntity.title}</h2>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Canonical slug: /{selectedEntity.slug}</span>
                </div>

                <Badge className={selectedEntity.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400'}>
                  {selectedEntity.status}
                </Badge>
              </div>

              {/* Connections Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Active Relational Connections ({outgoing.length + incoming.length})</span>
                </div>

                {outgoing.length === 0 && incoming.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800/60 text-slate-500 text-xs">
                    No explicit connections registered for this entity yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {outgoing.map((conn, idx) => {
                      const target = graph.entities.find(e => e.id === conn.toId);
                      if (!target) return null;
                      const TargetIcon = getEntityIcon(target.type);

                      return (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 text-xs">
                            <span className="text-slate-400 font-mono text-[10px] uppercase">{selectedEntity.type}</span>
                            <ArrowRight className="h-3 w-3 text-blue-400" />
                            <TargetIcon className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-white font-semibold">{target.title}</span>
                            <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-800 uppercase font-mono">
                              {target.type}
                            </Badge>
                          </div>

                          {selectedEntity.type === 'service' && target.type === 'technology' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUnlinkTech(selectedEntity.id, target.id)}
                              className="h-7 text-[11px] text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >
                              <Unlink className="h-3 w-3 mr-1" /> Unlink
                            </Button>
                          )}
                        </div>
                      );
                    })}

                    {incoming.map((conn, idx) => {
                      const source = graph.entities.find(e => e.id === conn.fromId);
                      if (!source) return null;
                      const SourceIcon = getEntityIcon(source.type);

                      return (
                        <div key={'in-' + idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 text-xs">
                            <SourceIcon className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-white font-semibold">{source.title}</span>
                            <ArrowRight className="h-3 w-3 text-emerald-400" />
                            <span className="text-slate-400 font-mono text-[10px] uppercase">{selectedEntity.type}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Connect Technology Helper */}
              {selectedEntity.type === 'service' && (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 pt-3">
                  <span className="text-xs font-bold text-white block">Connect Production Technology</span>
                  <div className="flex flex-wrap gap-1.5">
                    {graph.entities.filter(e => e.type === 'technology' && !outgoing.some(o => o.toId === e.id)).map(tech => (
                      <button
                        key={tech.id}
                        onClick={() => handleLinkTech(selectedEntity.id, tech.id)}
                        disabled={isLinking}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3 w-3 text-blue-400" />
                        <span>{tech.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
              Select an entity from the left list to explore its relational graph.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
