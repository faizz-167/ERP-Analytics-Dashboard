"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function AttendanceUploadPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string | null;
  }>({ type: null, message: null });
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.toLowerCase().endsWith(".csv")) {
        setFile(droppedFile);
        setStatus({ type: null, message: null });
      } else {
        setStatus({ type: "error", message: "Please upload a CSV file only." });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith(".csv")) {
        setStatus({ type: "error", message: "Please upload a CSV file only." });
        return;
      }
      setFile(selected);
      setStatus({ type: null, message: null });
    }
  };

  const removeFile = () => {
    setFile(null);
    setStatus({ type: null, message: null });
  };

  const handleSubmit = async () => {
    if (!file) {
      setStatus({ type: "error", message: "Please select a CSV file first." });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: null });

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 🔴 IMPORTANT: match the API route we implemented on the server
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setStatus({
        type: "success",
        message: "CSV uploaded successfully! Processing will begin shortly.",
      });
      setFile(null);

      // 🔁 Revalidate server components on this page (for history section)
      router.refresh();
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br w-full from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Upload className="h-8 w-8 text-blue-600" />
              Upload Weekly Attendance
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Upload your attendance data in CSV format for processing
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* CSV Format Info */}
            <Alert className="bg-blue-50 border-blue-200">
              <FileText className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <strong>Required CSV format:</strong>{" "}
                <code className="bg-white px-2 py-1 rounded text-xs">
                  register_number, subject_code, date, status
                </code>
              </AlertDescription>
            </Alert>

            {/* Upload Area */}
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />

                {!file ? (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        Drop your CSV file here
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        or click to browse
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      disabled={loading}
                      className="hover:bg-red-50"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {loading && (
                <div className="space-y-2">
                  <Progress value={66} className="h-2" />
                  <p className="text-sm text-center text-gray-600">
                    Uploading and processing...
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !file}
                className="w-full h-11 text-base"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </>
                )}
              </Button>
            </div>

            {/* Status Messages */}
            {status.message && (
              <Alert
                className={
                  status.type === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }
              >
                {status.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription
                  className={
                    status.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }
                >
                  {status.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="mt-6 bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              📋 Important Notes
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Ensure your CSV file follows the exact format specified above
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Date format should be consistent (e.g., YYYY-MM-DD)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Status values should be standardized (e.g., Present, Absent)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Maximum file size: 10 MB</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
