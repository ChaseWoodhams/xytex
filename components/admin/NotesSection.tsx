"use client";

import { useState } from "react";
import type { Note } from "@/lib/supabase/types";
import { StickyNote, Plus, Lock, Edit, Trash2 } from "lucide-react";

interface NotesSectionProps {
  accountId: string;
  notes: Note[];
  currentUserId: string;
}

export default function NotesSection({ accountId, notes, currentUserId }: NotesSectionProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-semibold text-navy-900">
          Notes
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <StickyNote className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-4">No notes yet</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Add First Note
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border border-navy-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  {note.title && (
                    <h3 className="text-lg font-heading font-semibold text-navy-900 mb-2">
                      {note.title}
                    </h3>
                  )}
                  <p className="text-navy-700 whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-navy-500 mt-2">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {note.is_private && (
                    <Lock className="w-4 h-4 text-navy-400" aria-label="Private note" />
                  )}
                  {note.created_by === currentUserId && (
                    <>
                      <button className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-navy-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

      {showForm && (
        <div className="mt-6 p-4 bg-cream-50 rounded-lg border border-navy-200">
          <p className="text-navy-600 mb-4">
            Note form will be implemented in the next phase
          </p>
          <button
            onClick={() => setShowForm(false)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

