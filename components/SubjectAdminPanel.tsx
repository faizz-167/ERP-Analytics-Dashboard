"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2, GraduationCap } from "lucide-react";

type Subject = {
  id: number;
  name: string;
  code: string;
  semester: number;
  departmentId: number | null;
};

type Props = {
  initialSubjects: Subject[];
  departmentId: number;
};

export default function SubjectAdminPanel({
  initialSubjects,
  departmentId,
}: Props) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !code || !semester) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/admin/subjects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          semester: Number(semester),
          departmentId, // optional if your API uses session dept; safe to send
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create subject");
      }

      const newSubject: Subject = {
        id: data.subject?.id ?? Math.random(),
        name,
        code,
        semester: Number(semester),
        departmentId,
      };

      setSubjects((prev) => [...prev, newSubject]);
      setName("");
      setCode("");
      setSemester("");

      toast.success("Subject created successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unexpected error creating subject."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subjectId: number) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/admin/subjects/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete subject");
      }

      setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
      toast.success("Subject deleted successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unexpected error deleting subject."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-2 border-primary-admin/20 shadow-lg">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-primary-admin/5 via-transparent to-primary-admin/5 pointer-events-none" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-admin/10 rounded-lg">
            <GraduationCap className="w-5 h-5 text-primary-admin" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">Manage Subjects</h3>
            <p className="text-xs text-gray-500">
              Add or remove subjects for your department
            </p>
          </div>
        </div>

        {/* Create form */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Subject name (e.g., Data Structures)"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-primary-admin focus:ring-2 focus:ring-primary-admin/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Subject code (e.g., CS201)"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-primary-admin focus:ring-2 focus:ring-primary-admin/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={loading}
            />
          </div>

          <div className="relative">
            <input
              type="number"
              placeholder="Semester (1-8)"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-primary-admin focus:ring-2 focus:ring-primary-admin/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              value={semester}
              onChange={(e) =>
                setSemester(e.target.value ? Number(e.target.value) : "")
              }
              disabled={loading}
              min={1}
              max={8}
            />
          </div>

          <Button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="w-full h-11 text-sm font-semibold bg-linear-to-r from-primary-admin to-primary-admin/80 hover:from-primary-admin/90 hover:to-primary-admin/70 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Subject
              </span>
            )}
          </Button>
        </div>

        {/* Subject list */}
        <div className="border-t-2 border-gray-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-gray-600" />
            <p className="text-sm font-semibold text-gray-700">
              Existing Subjects ({subjects.length})
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {subjects.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  No subjects yet
                </p>
                <p className="text-xs text-gray-500">
                  Add your first subject to get started
                </p>
              </div>
            ) : (
              subjects.map((s) => (
                <div
                  key={s.id}
                  className="group relative flex items-center gap-3 p-3 bg-linear-to-br from-gray-50 to-gray-100/50 hover:from-primary-admin/5 hover:to-primary-admin/10 border border-gray-200 hover:border-primary-admin/30 rounded-lg transition-all duration-200 hover:shadow-md"
                >
                  <div className="shrink-0 w-10 h-10 bg-white border border-gray-200 group-hover:border-primary-admin/30 rounded-lg flex items-center justify-center transition-all">
                    <span className="text-xs font-bold text-primary-admin">
                      {s.semester}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {s.name}
                    </p>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">
                      {s.code}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    disabled={loading}
                    className="shrink-0 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </Card>
  );
}
