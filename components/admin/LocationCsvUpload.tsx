"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  X,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { LOCATION_CSV_FIELDS, type LocationCsvFieldKey } from "@/lib/supabase/location-uploads";

interface LocationCsvUploadProps {
  accountId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type UploadStep = "upload" | "mapping" | "preview" | "result";

interface ParsedCsv {
  headers: string[];
  data: Record<string, string>[];
}

export default function LocationCsvUpload({
  accountId,
  onClose,
  onSuccess,
}: LocationCsvUploadProps) {
  const [step, setStep] = useState<UploadStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedCsv, setParsedCsv] = useState<ParsedCsv | null>(null);
  const [listName, setListName] = useState("");
  const [columnMapping, setColumnMapping] = useState<Record<string, LocationCsvFieldKey | "">>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    created: number;
    errors: string[];
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const parseCSV = (text: string): ParsedCsv => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) {
      return { headers: [], data: [] };
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const data = lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });

    return { headers, data };
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setListName(selectedFile.name.replace(/\.csv$/i, ""));

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setParsedCsv(parsed);

      // Auto-map columns based on fuzzy matching
      const autoMapping: Record<string, LocationCsvFieldKey | ""> = {};
      parsed.headers.forEach((header) => {
        const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, "");
        const match = LOCATION_CSV_FIELDS.find((field) => {
          const normalizedField = field.key.toLowerCase().replace(/_/g, "");
          const normalizedLabel = field.label.toLowerCase().replace(/\s/g, "");
          return (
            normalizedHeader === normalizedField ||
            normalizedHeader === normalizedLabel ||
            normalizedHeader.includes(normalizedField) ||
            normalizedField.includes(normalizedHeader)
          );
        });
        autoMapping[header] = match?.key || "";
      });
      setColumnMapping(autoMapping);
      setStep("mapping");
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = async () => {
    if (!parsedCsv || !file) return;

    // Validate that name is mapped
    const hasNameMapping = Object.values(columnMapping).includes("name");
    if (!hasNameMapping) {
      alert('Please map at least one column to "Location Name"');
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch("/api/admin/locations/upload-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          listName,
          fileName: file.name,
          columnMapping: Object.fromEntries(
            Object.entries(columnMapping).filter(([, v]) => v !== "")
          ),
          data: parsedCsv.data,
        }),
      });

      const result = await response.json();

      setUploadResult({
        success: result.created > 0,
        created: result.created || 0,
        errors: result.errors || [],
      });
      setStep("result");
    } catch (error: any) {
      setUploadResult({
        success: false,
        created: 0,
        errors: [error.message || "Upload failed"],
      });
      setStep("result");
    } finally {
      setIsUploading(false);
    }
  };

  const getMappedData = () => {
    if (!parsedCsv) return [];
    return parsedCsv.data.map((row) => {
      const mapped: Record<string, string> = {};
      for (const [csvCol, dbField] of Object.entries(columnMapping)) {
        if (dbField) {
          mapped[dbField] = row[csvCol] || "";
        }
      }
      return mapped;
    });
  };

  const requiredFieldsMapped = Object.values(columnMapping).includes("name");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-navy-100 flex items-center justify-between bg-gradient-to-r from-navy-900 to-navy-800">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-gold-400" />
            <h2 className="text-xl font-heading font-semibold text-white">
              Import Locations from CSV
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-navy-300 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-3 bg-cream-50 border-b border-navy-100">
          <div className="flex items-center justify-center gap-2">
            {["upload", "mapping", "preview", "result"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step === s
                      ? "bg-gold-500 text-white"
                      : ["upload", "mapping", "preview", "result"].indexOf(step) > i
                      ? "bg-green-500 text-white"
                      : "bg-navy-200 text-navy-600"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium capitalize ${
                    step === s ? "text-navy-900" : "text-navy-500"
                  }`}
                >
                  {s}
                </span>
                {i < 3 && (
                  <ChevronRight className="w-4 h-4 text-navy-300 mx-3" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  dragActive
                    ? "border-gold-500 bg-gold-50"
                    : "border-navy-300 hover:border-gold-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-16 h-16 text-navy-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-navy-700 mb-2">
                  Drag and drop your CSV file here
                </p>
                <p className="text-navy-500 mb-4">or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
              </div>

              <div className="bg-navy-50 rounded-lg p-4">
                <h4 className="font-semibold text-navy-900 mb-2">
                  CSV Format Tips
                </h4>
                <ul className="text-sm text-navy-600 space-y-1">
                  <li>• First row should contain column headers</li>
                  <li>• At minimum, include a column for location names</li>
                  <li>• Supported fields: name, address, city, state, zip, phone, email, contact info</li>
                  <li>• You&apos;ll be able to map columns in the next step</li>
                </ul>
              </div>
            </div>
          )}

          {/* Mapping Step */}
          {step === "mapping" && parsedCsv && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  List Name
                </label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="input w-full max-w-md"
                  placeholder="Enter a name for this import"
                />
                <p className="text-sm text-navy-500 mt-1">
                  This name will be used to identify and tag locations from this upload
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-navy-900 mb-2">
                  Map CSV Columns to Location Fields
                </h3>
                <p className="text-sm text-navy-600 mb-6">
                  Select which database field each CSV column should map to. Fields marked with
                  <span className="text-red-500 ml-1">*</span> are required.
                </p>

                <div className="space-y-3">
                  {parsedCsv.headers.map((header, index) => {
                    const sampleValue = parsedCsv.data[0]?.[header] || "";
                    const mappedValue = columnMapping[header];
                    const isMapped = Boolean(mappedValue && mappedValue.length > 0);
                    const mappedField = mappedValue && mappedValue.length > 0
                      ? LOCATION_CSV_FIELDS.find(f => f.key === mappedValue as LocationCsvFieldKey)
                      : null;

                    return (
                      <div
                        key={`${header}-${index}`}
                        className={`border-2 rounded-lg p-4 transition-all ${
                          isMapped
                            ? "border-gold-300 bg-gold-50"
                            : "border-navy-200 bg-white hover:border-navy-300"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* CSV Column (Left Side) */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-navy-500 uppercase tracking-wide">
                                CSV Column
                              </span>
                              {isMapped && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-base font-semibold text-navy-900 mb-1 break-words">
                              {header}
                            </p>
                            {sampleValue && (
                              <p className="text-xs text-navy-500 italic">
                                Example: &quot;{sampleValue.length > 50 ? `${sampleValue.substring(0, 50)}...` : sampleValue}&quot;
                              </p>
                            )}
                          </div>

                          {/* Arrow */}
                          <div className="flex items-center pt-6">
                            <ChevronRight className="w-5 h-5 text-navy-400" />
                          </div>

                          {/* Database Field (Right Side) */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-1">
                              <span className="text-xs font-semibold text-navy-500 uppercase tracking-wide">
                                Database Field
                              </span>
                            </div>
                            <select
                              value={columnMapping[header] || ""}
                              onChange={(e) =>
                                setColumnMapping((prev) => ({
                                  ...prev,
                                  [header]: e.target.value as LocationCsvFieldKey | "",
                                }))
                              }
                              className={`w-full input text-sm ${
                                isMapped ? "bg-white border-gold-400" : ""
                              }`}
                            >
                              <option value="">— Select field or skip —</option>
                              {LOCATION_CSV_FIELDS.map((field) => (
                                <option
                                  key={field.key}
                                  value={field.key}
                                  disabled={
                                    Object.values(columnMapping).includes(field.key) &&
                                    columnMapping[header] !== field.key
                                  }
                                >
                                  {field.label}
                                  {field.required ? " *" : ""}
                                </option>
                              ))}
                            </select>
                            {mappedField && (
                              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Mapped to {mappedField.label}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!requiredFieldsMapped && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-700">
                      Please map at least one column to &quot;Location Name&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && parsedCsv && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-navy-900">Preview Import</h3>
                  <p className="text-sm text-navy-600">
                    {parsedCsv.data.length} location{parsedCsv.data.length !== 1 ? "s" : ""} will be imported
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-navy-600">List Name</p>
                  <p className="font-semibold text-navy-900">{listName}</p>
                </div>
              </div>

              <div className="border border-navy-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-navy-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-navy-700">
                          #
                        </th>
                        {LOCATION_CSV_FIELDS.filter((f) =>
                          Object.values(columnMapping).includes(f.key)
                        ).map((field) => (
                          <th
                            key={field.key}
                            className="px-4 py-2 text-left font-semibold text-navy-700"
                          >
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-100">
                      {getMappedData()
                        .slice(0, 10)
                        .map((row, i) => (
                          <tr key={i} className="hover:bg-cream-50">
                            <td className="px-4 py-2 text-navy-500">{i + 1}</td>
                            {LOCATION_CSV_FIELDS.filter((f) =>
                              Object.values(columnMapping).includes(f.key)
                            ).map((field) => (
                              <td
                                key={field.key}
                                className="px-4 py-2 text-navy-700"
                              >
                                {row[field.key] || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {parsedCsv.data.length > 10 && (
                  <div className="px-4 py-2 bg-navy-50 text-center text-sm text-navy-600">
                    ... and {parsedCsv.data.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Result Step */}
          {step === "result" && uploadResult && (
            <div className="space-y-6">
              <div
                className={`p-6 rounded-xl text-center ${
                  uploadResult.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {uploadResult.success ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-800 mb-2">
                      Import Successful!
                    </h3>
                    <p className="text-green-700">
                      {uploadResult.created} location{uploadResult.created !== 1 ? "s" : ""} imported from{" "}
                      <strong>{listName}</strong>
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-red-800 mb-2">
                      Import Failed
                    </h3>
                    <p className="text-red-700">
                      {uploadResult.created > 0
                        ? `Only ${uploadResult.created} locations were imported`
                        : "No locations were imported"}
                    </p>
                  </>
                )}
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">
                    Errors ({uploadResult.errors.length})
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {uploadResult.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-navy-100 bg-cream-50 flex items-center justify-between">
          <div>
            {step !== "upload" && step !== "result" && (
              <button
                onClick={() => {
                  if (step === "mapping") setStep("upload");
                  if (step === "preview") setStep("mapping");
                }}
                className="btn btn-outline flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {step !== "result" && (
              <button onClick={onClose} className="btn btn-outline">
                Cancel
              </button>
            )}
            {step === "mapping" && (
              <button
                onClick={() => setStep("preview")}
                disabled={!requiredFieldsMapped || !listName.trim()}
                className="btn btn-primary flex items-center gap-2"
              >
                Preview
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === "preview" && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="btn btn-primary flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import {parsedCsv?.data.length} Locations
                  </>
                )}
              </button>
            )}
            {step === "result" && (
              <button
                onClick={() => {
                  onSuccess();
                  router.refresh();
                }}
                className="btn btn-primary"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

