"use client";

import { useState } from "react";
import type { Activity } from "@/lib/supabase/types";
import { Clock, Plus, Phone, Mail, Users, FileText, CheckSquare, MoreHorizontal } from "lucide-react";

interface ActivitiesTimelineProps {
  accountId: string;
  activities: Activity[];
}

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  task: CheckSquare,
  other: MoreHorizontal,
};

export default function ActivitiesTimeline({ accountId, activities }: ActivitiesTimelineProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-semibold text-navy-900">
          Activity Timeline
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Log Activity
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-4">No activities logged yet</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Log First Activity
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.activity_type] || MoreHorizontal;
            return (
              <div
                key={activity.id}
                className="flex gap-4 border-l-2 border-navy-200 pl-4 py-4"
              >
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-navy-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-navy-900">{activity.subject}</h3>
                    <span className="text-xs text-navy-500 capitalize">
                      {activity.activity_type}
                    </span>
                  </div>
                  <p className="text-sm text-navy-600 mb-2">
                    {new Date(activity.activity_date).toLocaleString()}
                  </p>
                  {activity.description && (
                    <p className="text-navy-700">{activity.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="mt-6 p-4 bg-cream-50 rounded-lg border border-navy-200">
          <p className="text-navy-600 mb-4">
            Activity form will be implemented in the next phase
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

