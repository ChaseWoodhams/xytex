"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Note, Location } from "@/lib/supabase/types";
import { StickyNote, Plus, Lock, Edit, Trash2, X, Save, MapPin } from "lucide-react";
import { showToast } from "@/components/shared/toast";

interface NotesSectionProps {
  accountId: string;
  notes: Note[];
  currentUserId: string;
  locations?: Location[];
  locationId?: string;
}

export default function NotesSection({
  accountId,
  notes: initialNotes,
  currentUserId,
  locations = [],
  locationId,
}: NotesSectionProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_private: false,
    location_id: locationId || "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      is_private: false,
      location_id: locationId || "",
    });
    setEditingNote(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    setIsSaving(true);
    try {
      if (editingNote) {
        // Update existing note
        const response = await fetch(`/api/admin/notes/${editingNote.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title.trim() || null,
            content: formData.content.trim(),
            is_private: formData.is_private,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update note");
        }

        const updatedNote = await response.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
        );
        showToast("Note updated successfully", "success");
      } else {
        // Create new note
        const response = await fetch("/api/admin/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_id: accountId,
            location_id: formData.location_id || null,
            title: formData.title.trim() || null,
            content: formData.content.trim(),
            is_private: formData.is_private,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create note");
        }

        const newNote = await response.json();
        setNotes((prev) => [newNote, ...prev]);
        showToast("Note added successfully", "success");
      }

      setShowForm(false);
      resetForm();
      router.refresh();
    } catch (error: any) {
      console.error("Error saving note:", error);
      showToast(error.message || "Failed to save note", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title || "",
      content: note.content,
      is_private: note.is_private,
      location_id: note.location_id || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    setIsDeleting(noteId);
    try {
      const response = await fetch(`/api/admin/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      showToast("Note deleted", "success");
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting note:", error);
      showToast(error.message || "Failed to delete note", "error");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  // Filter notes by location
  const filteredNotes = notes.filter((note) => {
    if (locationFilter === "all") return true;
    if (locationFilter === "account") return !note.location_id;
    return note.location_id === locationFilter;
  });

  // Get location name by id
  const getLocationName = (locId: string | null) => {
    if (!locId) return null;
    const loc = locations.find((l) => l.id === locId);
    return loc?.name || "Unknown Location";
  };

  const showLocationSelector = locations.length > 0 && !locationId;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-semibold text-navy-900">
          Notes
        </h2>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Add Note
          </button>
        )}
      </div>

      {/* Location Filter - only when locations are available and not scoped to a single location */}
      {showLocationSelector && locations.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-navy-200">
          <button
            onClick={() => setLocationFilter("all")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              locationFilter === "all"
                ? "bg-gold-600 text-white"
                : "bg-navy-100 text-navy-700 hover:bg-navy-200"
            }`}
          >
            All Notes
          </button>
          <button
            onClick={() => setLocationFilter("account")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              locationFilter === "account"
                ? "bg-gold-600 text-white"
                : "bg-navy-100 text-navy-700 hover:bg-navy-200"
            }`}
          >
            Account-Level
          </button>
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setLocationFilter(loc.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                locationFilter === loc.id
                  ? "bg-gold-600 text-white"
                  : "bg-navy-100 text-navy-700 hover:bg-navy-200"
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}

      {/* Note Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 border border-navy-200 rounded-lg bg-navy-50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-navy-900">
              {editingNote ? "Edit Note" : "Add New Note"}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 text-navy-600 hover:text-navy-900 hover:bg-navy-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="note-title"
                className="block text-sm font-medium text-navy-700 mb-1"
              >
                Title (Optional)
              </label>
              <input
                type="text"
                id="note-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="Note title..."
              />
            </div>

            <div>
              <label
                htmlFor="note-content"
                className="block text-sm font-medium text-navy-700 mb-1"
              >
                Content *
              </label>
              <textarea
                id="note-content"
                required
                rows={4}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="Write your note..."
              />
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {/* Location Selector */}
              {showLocationSelector && !editingNote && (
                <div className="flex-1 min-w-[200px]">
                  <label
                    htmlFor="note-location"
                    className="block text-sm font-medium text-navy-700 mb-1"
                  >
                    Assign to Location
                  </label>
                  <select
                    id="note-location"
                    value={formData.location_id}
                    onChange={(e) =>
                      setFormData({ ...formData, location_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="">Account-Level (No Location)</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="note-private"
                  checked={formData.is_private}
                  onChange={(e) =>
                    setFormData({ ...formData, is_private: e.target.checked })
                  }
                  className="w-4 h-4 text-gold-600 border-navy-300 rounded focus:ring-gold-500"
                />
                <label
                  htmlFor="note-private"
                  className="text-sm font-medium text-navy-700"
                >
                  Private (only visible to you)
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2"
              disabled={isSaving || !formData.content.trim()}
            >
              <Save className="w-4 h-4" />
              {isSaving
                ? "Saving..."
                : editingNote
                ? "Update Note"
                : "Add Note"}
            </button>
          </div>
        </form>
      )}

      {filteredNotes.length === 0 && !showForm ? (
        <div className="text-center py-12">
          <StickyNote className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-4">
            {locationFilter !== "all"
              ? "No notes for this filter"
              : "No notes yet"}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            Add First Note
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="border border-navy-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {note.title && (
                      <h3 className="text-lg font-heading font-semibold text-navy-900">
                        {note.title}
                      </h3>
                    )}
                    {note.is_private && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-navy-100 text-navy-600 rounded-full">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    )}
                    {/* Location badge */}
                    {note.location_id && showLocationSelector && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        <MapPin className="w-3 h-3" />
                        {getLocationName(note.location_id)}
                      </span>
                    )}
                  </div>
                  <p className="text-navy-700 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <p className="text-xs text-navy-500 mt-2">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  {note.created_by === currentUserId && (
                    <>
                      <button
                        onClick={() => handleEdit(note)}
                        className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                        title="Edit note"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={isDeleting === note.id}
                        className="p-2 text-navy-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
