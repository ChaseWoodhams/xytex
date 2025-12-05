"use client";

import { useState, useMemo } from "react";
import type { Location, Note, Activity, Agreement } from "@/lib/supabase/types";
import type { AgreementStatusInfo } from "@/lib/supabase/agreements";
import { MapPin, Plus, Edit, Trash2, Search, ChevronDown, ChevronUp, StickyNote, Clock, FileText } from "lucide-react";

interface LocationsListProps {
  locations: Location[];
  locationAgreementStatuses: Record<string, AgreementStatusInfo>;
  locationAgreements: Record<string, Agreement | null>;
  onViewAgreementsTab: (locationId: string) => void;
}

export default function LocationsList({
  locations,
  locationAgreementStatuses,
  locationAgreements,
  onViewAgreementsTab,
}: LocationsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [locationNotes, setLocationNotes] = useState<Record<string, Note[]>>({});
  const [locationActivities, setLocationActivities] = useState<Record<string, Activity[]>>({});
  const [loadingLocations, setLoadingLocations] = useState<Set<string>>(new Set());

  const toggleLocation = async (locationId: string) => {
    if (expandedLocations.has(locationId)) {
      setExpandedLocations(prev => {
        const next = new Set(prev);
        next.delete(locationId);
        return next;
      });
    } else {
      setExpandedLocations(prev => new Set(prev).add(locationId));
      
      // Fetch notes and activities if not already loaded
      if (!locationNotes[locationId] && !locationActivities[locationId]) {
        setLoadingLocations(prev => new Set(prev).add(locationId));
        try {
          const [notesRes, activitiesRes] = await Promise.all([
            fetch(`/api/admin/locations/${locationId}/notes`),
            fetch(`/api/admin/locations/${locationId}/activities`),
          ]);
          
          const notes = notesRes.ok ? await notesRes.json() : [];
          const activities = activitiesRes.ok ? await activitiesRes.json() : [];
          
          setLocationNotes(prev => ({ ...prev, [locationId]: notes }));
          setLocationActivities(prev => ({ ...prev, [locationId]: activities }));
        } catch (error) {
          console.error('Error fetching location data:', error);
        } finally {
          setLoadingLocations(prev => {
            const next = new Set(prev);
            next.delete(locationId);
            return next;
          });
        }
      }
    }
  };

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) {
      return locations;
    }

    const query = searchQuery.toLowerCase();
    return locations.filter((location) => {
      return (
        location.name?.toLowerCase().includes(query) ||
        location.code?.toLowerCase().includes(query) ||
        location.city?.toLowerCase().includes(query) ||
        location.state?.toLowerCase().includes(query) ||
        location.zip_code?.toLowerCase().includes(query) ||
        location.contact_name?.toLowerCase().includes(query) ||
        location.email?.toLowerCase().includes(query) ||
        location.phone?.toLowerCase().includes(query) ||
        location.address_line1?.toLowerCase().includes(query)
      );
    });
  }, [locations, searchQuery]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-semibold text-navy-900">
          Locations
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Location
        </button>
      </div>

      {/* Search Bar */}
      {locations.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            <input
              type="text"
              placeholder="Search locations by name, code, city, contact, etc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-navy-600">
              Showing {filteredLocations.length} of {locations.length} location{locations.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {locations.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-4">No locations added yet</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Add First Location
          </button>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-2">No locations match your search</p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-gold-600 hover:text-gold-700 font-medium text-sm"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLocations.map((location) => (
            <div
              key={location.id}
              className="border border-navy-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-lg font-heading font-semibold text-navy-900">
                      {location.name}
                    </h3>
                    {location.code && (
                      <span className="font-mono text-xs font-semibold text-gold-600 bg-gold-50 px-2 py-1 rounded">
                        {location.code}
                      </span>
                    )}
                    {(() => {
                      const agreementStatus = locationAgreementStatuses[location.id];
                      if (agreementStatus && agreementStatus.status !== 'none') {
                        const statusColors = {
                          green: 'bg-green-100 text-green-800 border-green-200',
                          yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          red: 'bg-red-100 text-red-800 border-red-200',
                        };
                        
                        const statusLabels = {
                          green: 'Current',
                          yellow: agreementStatus.daysUntilRenewal 
                            ? `Renews in ${Math.ceil(agreementStatus.daysUntilRenewal / 30)}mo`
                            : 'Renewal Due',
                          red: 'Expired',
                        };
                        
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[agreementStatus.status]}`}
                            title={
                              agreementStatus.startDate
                                ? `Agreement signed: ${new Date(agreementStatus.startDate).toLocaleDateString()}`
                                : 'No agreement date'
                            }
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                agreementStatus.status === 'green'
                                  ? 'bg-green-600'
                                  : agreementStatus.status === 'yellow'
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                              }`}
                            />
                            {statusLabels[agreementStatus.status]}
                          </span>
                        );
                      }
                      return null;
                    })()}
                    {location.is_primary && (
                      <span className="px-2 py-1 text-xs font-semibold bg-gold-100 text-gold-800 rounded-full">
                        Primary
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        location.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {location.status}
                    </span>
                    {(() => {
                      const agreement = locationAgreements[location.id];
                      if (!agreement) return null;

                      const hasDocument = !!agreement.document_url;

                      return (
                        <div className="inline-flex items-center gap-2">
                          {hasDocument && (
                            <a
                              href={agreement.document_url as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-700"
                            >
                              <FileText className="w-3 h-3" />
                              Download
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onViewAgreementsTab(location.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-700"
                          >
                            <FileText className="w-3 h-3" />
                            View Agreement
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-sm text-navy-600 space-y-1">
                    {location.address_line1 && (
                      <p>
                        {location.address_line1}
                        {location.address_line2 && `, ${location.address_line2}`}
                      </p>
                    )}
                    {(location.city || location.state || location.zip_code) && (
                      <p>
                        {[location.city, location.state, location.zip_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {location.phone && (
                      <p>
                        <a
                          href={`tel:${location.phone}`}
                          className="text-gold-600 hover:text-gold-700"
                        >
                          {location.phone}
                        </a>
                      </p>
                    )}
                    {location.email && (
                      <p>
                        <a
                          href={`mailto:${location.email}`}
                          className="text-gold-600 hover:text-gold-700"
                        >
                          {location.email}
                        </a>
                      </p>
                    )}
                    {location.contact_name && (
                      <p>
                        <strong>Contact:</strong> {location.contact_name}
                        {location.contact_title && ` (${location.contact_title})`}
                      </p>
                    )}
                  </div>
                  {location.notes && (
                    <p className="mt-2 text-sm text-navy-600">{location.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => toggleLocation(location.id)}
                    className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                    title={expandedLocations.has(location.id) ? "Collapse" : "View notes & activities"}
                  >
                    {expandedLocations.has(location.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-navy-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Expanded Notes & Activities Section */}
              {expandedLocations.has(location.id) && (
                <div className="mt-4 pt-4 border-t border-navy-200">
                  {loadingLocations.has(location.id) ? (
                    <div className="text-center py-4 text-navy-600">Loading...</div>
                  ) : (
                    <div className="space-y-6">
                      {/* Location Notes */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
                            <StickyNote className="w-4 h-4" />
                            Notes ({locationNotes[location.id]?.length || 0})
                          </h4>
                          <button className="text-xs text-gold-600 hover:text-gold-700 font-medium">
                            Add Note
                          </button>
                        </div>
                        {locationNotes[location.id] && locationNotes[location.id].length > 0 ? (
                          <div className="space-y-2">
                            {locationNotes[location.id].map((note) => (
                              <div key={note.id} className="bg-cream-50 rounded-lg p-3 border border-navy-200">
                                {note.title && (
                                  <h5 className="font-medium text-navy-900 mb-1">{note.title}</h5>
                                )}
                                <p className="text-sm text-navy-700 whitespace-pre-wrap">{note.content}</p>
                                <p className="text-xs text-navy-500 mt-1">
                                  {new Date(note.created_at).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-navy-500 italic">No notes for this location</p>
                        )}
                      </div>

                      {/* Location Activities */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Activities ({locationActivities[location.id]?.length || 0})
                          </h4>
                          <button className="text-xs text-gold-600 hover:text-gold-700 font-medium">
                            Log Activity
                          </button>
                        </div>
                        {locationActivities[location.id] && locationActivities[location.id].length > 0 ? (
                          <div className="space-y-2">
                            {locationActivities[location.id].map((activity) => (
                              <div key={activity.id} className="bg-cream-50 rounded-lg p-3 border border-navy-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-navy-900 mb-1">{activity.subject}</h5>
                                    <p className="text-xs text-navy-500 mb-1 capitalize">{activity.activity_type}</p>
                                    {activity.description && (
                                      <p className="text-sm text-navy-700">{activity.description}</p>
                                    )}
                                    <p className="text-xs text-navy-500 mt-1">
                                      {new Date(activity.activity_date).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-navy-500 italic">No activities for this location</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="mt-6 p-4 bg-cream-50 rounded-lg border border-navy-200">
          <p className="text-navy-600 mb-4">
            Location form will be implemented in the next phase
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

