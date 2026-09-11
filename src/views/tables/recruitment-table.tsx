'use client';

/**
 * @file admin/src/views/tables/recruitment-table.tsx
 * @description [VIEW] Interactive management table and modal dialogs for Recruitment & Job Openings.
 */

import { useState } from 'react';
import { AdminJobOpening } from '@/models/types';
import {
  createJobOpening,
  updateJobOpening,
  deleteJobOpening,
  reorderJobOpening,
  toggleJobOpeningStatus,
} from '@/controllers/recruitment.controller';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Briefcase,
  Search,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';

interface RecruitmentTableProps {
  initialData: AdminJobOpening[];
}

const DEPARTMENT_PRESETS = [
  'Engineering',
  'AI & Automation',
  'Cloud Ops',
  'Design & Creative',
  'Product',
  'Consulting',
];

export function RecruitmentTable({ initialData }: RecruitmentTableProps) {
  const [data, setData] = useState<AdminJobOpening[]>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<AdminJobOpening | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [type, setType] = useState('Full-Time / Remote');
  const [location, setLocation] = useState('Remote');
  const [experience, setExperience] = useState('3+ Years');
  const [salary, setSalary] = useState('Top Market / Competitive');
  const [applyUrl, setApplyUrl] = useState('/contact');
  const [description, setDescription] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [active, setActive] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);

  // Filtered jobs
  const filteredData = data.filter((j) => {
    const matchesDept = selectedDept === 'all' || j.department === selectedDept;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesDept;

    const matchesQuery =
      j.title.toLowerCase().includes(query) ||
      j.department.toLowerCase().includes(query) ||
      j.description.toLowerCase().includes(query) ||
      (j.skills || []).some((s) => s.toLowerCase().includes(query));

    return matchesDept && matchesQuery;
  });

  const activeCount = data.filter((j) => j.active).length;
  const draftCount = data.length - activeCount;
  const departmentsList = Array.from(new Set(data.map((j) => j.department)));

  const openCreateModal = () => {
    setEditingJob(null);
    setTitle('');
    setDepartment('Engineering');
    setType('Full-Time / Remote');
    setLocation('Remote');
    setExperience('3+ Years');
    setSalary('Top Market / Competitive');
    setApplyUrl('/contact');
    setDescription('');
    setSkillsText('Next.js, React, TypeScript, Node.js, PostgreSQL');
    setActive(true);
    setOrderIndex(data.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (job: AdminJobOpening) => {
    setEditingJob(job);
    setTitle(job.title);
    setDepartment(job.department || 'Engineering');
    setType(job.type || 'Full-Time / Remote');
    setLocation(job.location || 'Remote');
    setExperience(job.experience || '');
    setSalary(job.salary || '');
    setApplyUrl(job.applyUrl || '/contact');
    setDescription(job.description || '');
    setSkillsText((job.skills || []).join(', '));
    setActive(job.active);
    setOrderIndex(job.orderIndex);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill in the Job Title and Description.');
      return;
    }

    setIsSubmitting(true);
    const parsedSkills = skillsText
      .split(/[,|\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingJob) {
        const res = await updateJobOpening(editingJob.id, {
          title: title.trim(),
          department: department.trim(),
          type: type.trim(),
          location: location.trim(),
          experience: experience.trim() || null,
          salary: salary.trim() || null,
          applyUrl: applyUrl.trim() || '/contact',
          description: description.trim(),
          skills: parsedSkills,
          active,
          orderIndex,
        });

        if (res.success) {
          setData((prev) =>
            prev.map((j) =>
              j.id === editingJob.id
                ? {
                    ...j,
                    title: title.trim(),
                    department: department.trim(),
                    type: type.trim(),
                    location: location.trim(),
                    experience: experience.trim() || null,
                    salary: salary.trim() || null,
                    applyUrl: applyUrl.trim() || '/contact',
                    description: description.trim(),
                    skills: parsedSkills,
                    active,
                    orderIndex,
                  }
                : j
            )
          );
          setIsModalOpen(false);
        } else {
          alert(res.error || 'Failed to update job opening');
        }
      } else {
        const res = await createJobOpening({
          title: title.trim(),
          department: department.trim(),
          type: type.trim(),
          location: location.trim(),
          experience: experience.trim() || null,
          salary: salary.trim() || null,
          applyUrl: applyUrl.trim() || '/contact',
          description: description.trim(),
          skills: parsedSkills,
          active,
          orderIndex,
        });

        if (res.success && res.data) {
          setData((prev) => [...prev, res.data as AdminJobOpening]);
          setIsModalOpen(false);
        } else {
          alert(res.error || 'Failed to create job opening');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, jobTitle: string) => {
    if (!confirm(`Are you sure you want to remove the job opening "${jobTitle}"? This will immediately remove it from the live client Careers page.`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await deleteJobOpening(id);
      if (res.success) {
        setData((prev) => prev.filter((j) => j.id !== id));
      } else {
        alert(res.error || 'Failed to delete job opening');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    const newActive = !currentActive;
    try {
      const res = await toggleJobOpeningStatus(id, newActive);
      if (res.success) {
        setData((prev) =>
          prev.map((j) => (j.id === id ? { ...j, active: newActive } : j))
        );
      } else {
        alert(res.error || 'Failed to update status');
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = data.findIndex((j) => j.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= data.length) return;

    // Optimistic swap
    const updated = [...data];
    const temp = updated[currentIndex];
    updated[currentIndex] = updated[targetIndex];
    updated[targetIndex] = temp;
    setData(updated);

    try {
      await reorderJobOpening(id, direction);
    } catch {
      // Revert if failed
      setData(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Openings
            </span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {data.length}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Synchronized with client site
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Live Roles
            </span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
              {activeCount}
            </span>
            <span className="text-[11px] text-emerald-500/80 mt-0.5 block">
              Visible on client /careers
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Draft / Hidden
            </span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
              {draftCount}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Unpublished listings
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Action Bar & Filtering */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles, skills, dept..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setSelectedDept('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                selectedDept === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
              )}
            >
              All Depts ({data.length})
            </button>
            {departmentsList.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDept(d)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                  selectedDept === d
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="http://localhost:3000/en/company#careers"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Preview Client Careers</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer h-9 px-4"
          >
            <Plus className="h-4 w-4" /> Add Job Opening
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-4 px-4 w-20">Order</th>
                <th className="py-4 px-4">Role Title & Dept</th>
                <th className="py-4 px-4 max-w-xs">Description</th>
                <th className="py-4 px-4">Skills / Tags</th>
                <th className="py-4 px-4 w-28">Status</th>
                <th className="py-4 px-4 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    No job openings match your query. Click &quot;Add Job Opening&quot; to publish a new role.
                  </td>
                </tr>
              ) : (
                filteredData.map((job, idx) => (
                  <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Order Column */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleReorder(job.id, 'up')}
                            disabled={idx === 0}
                            className="text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorder(job.id, 'down')}
                            disabled={idx === filteredData.length - 1}
                            className="text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Down"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-slate-300">#{job.orderIndex}</span>
                      </div>
                    </td>

                    {/* Role Title & Dept */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-100 text-sm">{job.title}</span>
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {job.department}
                          </span>
                          <span className="text-slate-400 font-medium flex items-center gap-1">
                            <Briefcase className="h-3 w-3 text-slate-500" />
                            {job.type}
                          </span>
                          <span className="text-slate-400 font-medium flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            {job.location}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    </td>

                    {/* Skills / Tags */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(job.skills || []).map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(job.id, job.active)}
                        disabled={togglingId === job.id}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer',
                          job.active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                        )}
                        title="Click to toggle visibility"
                      >
                        {togglingId === job.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : job.active ? (
                          <>
                            <Eye className="h-3 w-3" /> Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" /> Draft
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(job)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Edit Job Opening"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(job.id, job.title)}
                          disabled={isSubmitting}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
                          title="Remove Job Opening"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingJob ? 'Edit Job Opening' : 'Add New Job Opening'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingJob
                      ? 'Update role specifications and requirements.'
                      : 'Create a new opportunity to list on the client Careers section.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">
                    Job Title <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Architect"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-blue-500"
                  >
                    {DEPARTMENT_PRESETS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Employment Type</label>
                  <Input
                    type="text"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="e.g. Full-Time / Remote"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Location</label>
                  <Input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Remote or Hybrid - Kolkata"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Experience</label>
                  <Input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 5+ Years"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Role Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the primary mission, key responsibilities, and team impact of this role..."
                  className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* Skills Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Required Technologies & Skills (comma separated)
                </label>
                <Input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="e.g. Next.js, React, TypeScript, Node.js, PostgreSQL, Prisma"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
                <p className="text-[11px] text-slate-500">
                  These will render as stylish tech badges on each career card.
                </p>
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Display Order</label>
                  <Input
                    type="number"
                    min={0}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="text-xs font-bold text-slate-300 mb-2">Visibility Status</label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      Publish immediately on live website
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...
                    </>
                  ) : editingJob ? (
                    'Save Changes'
                  ) : (
                    'Publish Opening'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
