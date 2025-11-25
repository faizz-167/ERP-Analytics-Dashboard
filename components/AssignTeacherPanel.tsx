"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  BookOpen,
  GraduationCap,
} from "lucide-react";

type Teacher = {
  id: number;
  name: string;
  email: string;
};

type SubjectWithTeacher = {
  id: number;
  name: string;
  code: string;
  semester: number;
  assignedTeacherId: number | null;
  assignedTeacherName: string | null;
};

type Props = {
  subjects: SubjectWithTeacher[];
  teachers: Teacher[];
};

export default function AssignTeacherPanel({ subjects, teachers }: Props) {
  const router = useRouter();
  const [subjectList, setSubjectList] = useState(subjects);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | "">("");
  const [loading, setLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  const filteredSubjects = subjectList.filter(
    (sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignedCount = subjectList.filter((s) => s.assignedTeacherId).length;
  const unassignedCount = subjectList.length - assignedCount;

  const assignTeacher = async (
    subjectId: number,
    subjectName: string,
    subjectCode: string
  ) => {
    if (!selectedTeacherId) {
      toast.error("Please select a teacher first");
      return;
    }

    try {
      setLoading(subjectId);

      const res = await fetch("/api/admin/subjects/assign-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          teacherId: selectedTeacherId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign teacher");

      const teacher = teachers.find((t) => t.id === selectedTeacherId);

      setSubjectList((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? {
                ...s,
                assignedTeacherId: teacher?.id ?? null,
                assignedTeacherName: teacher?.name ?? null,
              }
            : s
        )
      );

      setSelectedTeacherId("");

      toast.success("Teacher assigned successfully", {
        description: `${teacher?.name} → ${subjectCode}`,
      });

      router.refresh();
    } catch (err: any) {
      toast.error("Failed to assign teacher", {
        description: err.message || "Unexpected error occurred",
      });
    } finally {
      setLoading(null);
    }
  };

  const removeTeacher = async (
    subjectId: number,
    subjectName: string,
    subjectCode: string,
    teacherName: string
  ) => {
    if (!confirm(`Remove ${teacherName} from ${subjectCode}?`)) return;

    try {
      setLoading(subjectId);

      const res = await fetch("/api/admin/subjects/remove-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove teacher");

      setSubjectList((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? { ...s, assignedTeacherId: null, assignedTeacherName: null }
            : s
        )
      );

      toast.success("Teacher removed successfully", {
        description: `${teacherName} unassigned from ${subjectCode}`,
      });

      router.refresh();
    } catch (err: any) {
      toast.error("Failed to remove teacher", {
        description: err.message || "Unexpected error occurred",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="relative overflow-hidden border-2 border-purple-200 shadow-lg">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-purple-50 via-transparent to-blue-50 pointer-events-none" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-linear-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">Assign Teachers</h3>
            <p className="text-xs text-gray-600">
              Manage subject-faculty mappings
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-linear-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">
                Assigned
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">
              {assignedCount}
            </p>
          </div>

          <div className="p-3 bg-linear-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">
                Pending
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {unassignedCount}
            </p>
          </div>
        </div>

        {/* Teacher Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Faculty Member
          </label>
          <div className="relative">
            <select
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 pr-10 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all appearance-none bg-white"
              value={selectedTeacherId}
              onChange={(e) =>
                setSelectedTeacherId(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
            >
              <option value="">Choose a teacher...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} • {t.email}
                </option>
              ))}
            </select>
            <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {selectedTeacher && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {selectedTeacher.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {selectedTeacher.name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {selectedTeacher.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search subjects..."
            className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Subject List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredSubjects.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {searchQuery ? "No subjects found" : "No subjects available"}
              </p>
            </div>
          ) : (
            filteredSubjects.map((sub) => (
              <div
                key={sub.id}
                className={`group relative border-2 rounded-xl p-4 transition-all duration-200 ${
                  sub.assignedTeacherId
                    ? "bg-linear-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 hover:border-emerald-300"
                    : "bg-linear-to-br from-gray-50 to-white border-gray-200 hover:border-purple-300"
                } hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Subject Info */}
                    <div className="flex items-start gap-3 mb-2">
                      <div
                        className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border-2 ${
                          sub.assignedTeacherId
                            ? "bg-emerald-500 text-white border-emerald-600"
                            : "bg-white text-purple-600 border-purple-200"
                        }`}
                      >
                        {sub.semester}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm mb-1 truncate">
                          {sub.name}
                        </p>
                        <p className="text-xs font-mono text-gray-600 bg-white px-2 py-0.5 rounded inline-block">
                          {sub.code}
                        </p>
                      </div>
                    </div>

                    {/* Assignment Status */}
                    {sub.assignedTeacherId ? (
                      <div className="flex items-center gap-2 mt-3 p-2 bg-white/80 rounded-lg border border-emerald-200">
                        <div className="w-6 h-6 rounded-full bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                          {sub.assignedTeacherName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Assigned to</p>
                          <p className="text-sm font-semibold text-emerald-700 truncate">
                            {sub.assignedTeacherName}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-3">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs text-amber-600 font-medium">
                          Not assigned
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0">
                    {sub.assignedTeacherId ? (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          removeTeacher(
                            sub.id,
                            sub.name,
                            sub.code,
                            sub.assignedTeacherName!
                          )
                        }
                        disabled={loading === sub.id}
                        className="h-10 w-10 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
                      >
                        {loading === sub.id ? (
                          <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          assignTeacher(sub.id, sub.name, sub.code)
                        }
                        disabled={loading === sub.id || !selectedTeacherId}
                        className="h-10 px-4 bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading === sub.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1.5" />
                            <span className="text-sm font-semibold">
                              Assign
                            </span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        {filteredSubjects.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Showing {filteredSubjects.length} of {subjectList.length} subjects
            </p>
          </div>
        )}
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
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </Card>
  );
}
