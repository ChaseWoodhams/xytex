"use client";

import { useState } from "react";
import type { MarketingDonor } from "@/lib/supabase/types";
import { Loader2, X, ChevronDown, ChevronUp } from "lucide-react";

interface DonorFormProps {
  donor?: MarketingDonor;
  onClose: () => void;
  onSave: () => void;
}

export default function DonorForm({ donor, onClose, onSave }: DonorFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["core", "demographics", "physical"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const [formData, setFormData] = useState({
    // Core Identification
    id: donor?.id || "",
    name: donor?.name || "",
    year_of_birth: donor?.year_of_birth?.toString() || "",
    marital_status: donor?.marital_status || "",
    number_of_children: donor?.number_of_children?.toString() || "",

    // Demographics
    occupation: donor?.occupation || "",
    education: donor?.education || "",
    blood_type: donor?.blood_type || "",
    nationality_maternal: donor?.nationality_maternal || "",
    nationality_paternal: donor?.nationality_paternal || "",
    race: donor?.race || "",
    cmv_status: donor?.cmv_status || "",

    // Physical Attributes
    height_feet_inches: donor?.height_feet_inches || "",
    height_cm: donor?.height_cm?.toString() || "",
    weight_lbs: donor?.weight_lbs?.toString() || "",
    weight_kg: donor?.weight_kg?.toString() || "",
    eye_color: donor?.eye_color || "",
    hair_color: donor?.hair_color || "",
    hair_texture: donor?.hair_texture || "",
    hair_loss: donor?.hair_loss || "",
    hair_type: donor?.hair_type || "",
    body_build: donor?.body_build || "",
    freckles: donor?.freckles || "",
    skin_tone: donor?.skin_tone || "",

    // Genetic Testing
    genetic_tests_count: donor?.genetic_tests_count?.toString() || "",
    last_medical_history_update: donor?.last_medical_history_update || "",

    // Personality & Interests
    skills_hobbies_interests: donor?.skills_hobbies_interests || "",
    personality_description: donor?.personality_description || "",
    health_comments: donor?.health_comments || "",

    // Purchase Options
    audio_file_available: donor?.audio_file_available || false,
    photos_available: donor?.photos_available || false,
    inventory_summary: donor?.inventory_summary || "",

    // Metadata
    document_id: donor?.document_id || "",
    source_url: donor?.source_url || "",
  });

  // JSONB fields as strings for editing
  const [jsonFields, setJsonFields] = useState({
    genetic_test_results: JSON.stringify(donor?.genetic_test_results || {}, null, 2),
    health_info: JSON.stringify(donor?.health_info || {}, null, 2),
    education_details: JSON.stringify(donor?.education_details || {}, null, 2),
    immediate_family_history: JSON.stringify(donor?.immediate_family_history || {}, null, 2),
    paternal_family_history: JSON.stringify(donor?.paternal_family_history || {}, null, 2),
    maternal_family_history: JSON.stringify(donor?.maternal_family_history || {}, null, 2),
    health_diseases: JSON.stringify(donor?.health_diseases || {}, null, 2),
    vial_options: JSON.stringify(donor?.vial_options || [], null, 2),
    compliance_flags: JSON.stringify(donor?.compliance_flags || {}, null, 2),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Parse JSONB fields
      let parsedJsonFields: Record<string, any> = {};
      for (const [key, value] of Object.entries(jsonFields)) {
        try {
          parsedJsonFields[key] = value ? JSON.parse(value) : null;
        } catch (err) {
          throw new Error(`Invalid JSON in ${key}: ${err}`);
        }
      }

      const payload: any = {
        ...formData,
        year_of_birth: formData.year_of_birth ? parseInt(formData.year_of_birth) : null,
        number_of_children: formData.number_of_children
          ? parseInt(formData.number_of_children)
          : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        weight_lbs: formData.weight_lbs ? parseInt(formData.weight_lbs) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        genetic_tests_count: formData.genetic_tests_count
          ? parseInt(formData.genetic_tests_count)
          : null,
        last_medical_history_update: formData.last_medical_history_update || null,
        ...parsedJsonFields,
      };

      // Remove empty strings and convert to null
      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") {
          payload[key] = null;
        }
      });

      const url = donor
        ? `/api/admin/marketing-donors/${donor.id}`
        : "/api/admin/marketing-donors";
      const method = donor ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save donor");
      }

      onSave();
    } catch (err: any) {
      setError(err.message || "Failed to save donor");
    } finally {
      setLoading(false);
    }
  };

  const Section = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.has(id);
    return (
      <div className="border border-navy-200 rounded-lg mb-4">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full px-6 py-4 flex items-center justify-between bg-navy-50 hover:bg-navy-100 transition-colors"
        >
          <h3 className="text-lg font-semibold text-navy-900">{title}</h3>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-navy-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-navy-600" />
          )}
        </button>
        {isExpanded && <div className="p-6 space-y-4">{children}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-navy-900 mb-1">
            {donor ? "Edit Donor" : "New Donor"}
          </h2>
          <p className="text-navy-600">
            {donor ? "Update donor information" : "Add a new marketing donor"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-navy-600 hover:text-navy-900 p-2"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <Section id="core" title="Core Identification">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Donor ID *
              </label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
                disabled={!!donor}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Year of Birth
              </label>
              <input
                type="number"
                value={formData.year_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, year_of_birth: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Marital Status
              </label>
              <input
                type="text"
                value={formData.marital_status}
                onChange={(e) =>
                  setFormData({ ...formData, marital_status: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Number of Children
              </label>
              <input
                type="number"
                value={formData.number_of_children}
                onChange={(e) =>
                  setFormData({ ...formData, number_of_children: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
        </Section>

        <Section id="demographics" title="Demographics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Occupation
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) =>
                  setFormData({ ...formData, occupation: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Education
              </label>
              <input
                type="text"
                value={formData.education}
                onChange={(e) =>
                  setFormData({ ...formData, education: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Blood Type
              </label>
              <input
                type="text"
                value={formData.blood_type}
                onChange={(e) =>
                  setFormData({ ...formData, blood_type: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                CMV Status
              </label>
              <input
                type="text"
                value={formData.cmv_status}
                onChange={(e) =>
                  setFormData({ ...formData, cmv_status: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Nationality (Maternal)
              </label>
              <input
                type="text"
                value={formData.nationality_maternal}
                onChange={(e) =>
                  setFormData({ ...formData, nationality_maternal: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Nationality (Paternal)
              </label>
              <input
                type="text"
                value={formData.nationality_paternal}
                onChange={(e) =>
                  setFormData({ ...formData, nationality_paternal: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Race
              </label>
              <input
                type="text"
                value={formData.race}
                onChange={(e) => setFormData({ ...formData, race: e.target.value })}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
        </Section>

        <Section id="physical" title="Physical Attributes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Height (feet/inches)
              </label>
              <input
                type="text"
                value={formData.height_feet_inches}
                onChange={(e) =>
                  setFormData({ ...formData, height_feet_inches: e.target.value })
                }
                placeholder="5'9&quot;"
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={formData.height_cm}
                onChange={(e) =>
                  setFormData({ ...formData, height_cm: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Weight (lbs)
              </label>
              <input
                type="number"
                value={formData.weight_lbs}
                onChange={(e) =>
                  setFormData({ ...formData, weight_lbs: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                value={formData.weight_kg}
                onChange={(e) =>
                  setFormData({ ...formData, weight_kg: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Eye Color
              </label>
              <input
                type="text"
                value={formData.eye_color}
                onChange={(e) =>
                  setFormData({ ...formData, eye_color: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Hair Color
              </label>
              <input
                type="text"
                value={formData.hair_color}
                onChange={(e) =>
                  setFormData({ ...formData, hair_color: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Hair Texture
              </label>
              <input
                type="text"
                value={formData.hair_texture}
                onChange={(e) =>
                  setFormData({ ...formData, hair_texture: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Hair Loss
              </label>
              <input
                type="text"
                value={formData.hair_loss}
                onChange={(e) =>
                  setFormData({ ...formData, hair_loss: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Hair Type
              </label>
              <input
                type="text"
                value={formData.hair_type}
                onChange={(e) =>
                  setFormData({ ...formData, hair_type: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Body Build
              </label>
              <input
                type="text"
                value={formData.body_build}
                onChange={(e) =>
                  setFormData({ ...formData, body_build: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Freckles
              </label>
              <input
                type="text"
                value={formData.freckles}
                onChange={(e) =>
                  setFormData({ ...formData, freckles: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Skin Tone
              </label>
              <input
                type="text"
                value={formData.skin_tone}
                onChange={(e) =>
                  setFormData({ ...formData, skin_tone: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
        </Section>

        <Section id="genetic" title="Genetic Testing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Genetic Tests Count
              </label>
              <input
                type="number"
                value={formData.genetic_tests_count}
                onChange={(e) =>
                  setFormData({ ...formData, genetic_tests_count: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Last Medical History Update
              </label>
              <input
                type="date"
                value={formData.last_medical_history_update}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    last_medical_history_update: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Genetic Test Results (JSON)
              </label>
              <textarea
                value={jsonFields.genetic_test_results}
                onChange={(e) =>
                  setJsonFields({
                    ...jsonFields,
                    genetic_test_results: e.target.value,
                  })
                }
                rows={10}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 font-mono text-sm"
              />
            </div>
          </div>
        </Section>

        <Section id="personality" title="Personality & Interests">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Skills, Hobbies & Interests
              </label>
              <textarea
                value={formData.skills_hobbies_interests}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    skills_hobbies_interests: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Personality Description
              </label>
              <textarea
                value={formData.personality_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personality_description: e.target.value,
                  })
                }
                rows={4}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Health Comments
              </label>
              <textarea
                value={formData.health_comments}
                onChange={(e) =>
                  setFormData({ ...formData, health_comments: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
        </Section>

        <Section id="purchase" title="Purchase Options">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.audio_file_available}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    audio_file_available: e.target.checked,
                  })
                }
                className="w-4 h-4 text-gold-600 border-navy-300 rounded focus:ring-gold-500"
              />
              <label className="text-sm font-medium text-navy-700">
                Audio File Available
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.photos_available}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    photos_available: e.target.checked,
                  })
                }
                className="w-4 h-4 text-gold-600 border-navy-300 rounded focus:ring-gold-500"
              />
              <label className="text-sm font-medium text-navy-700">
                Photos Available
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Inventory Summary
              </label>
              <input
                type="text"
                value={formData.inventory_summary}
                onChange={(e) =>
                  setFormData({ ...formData, inventory_summary: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Vial Options (JSON Array)
              </label>
              <textarea
                value={jsonFields.vial_options}
                onChange={(e) =>
                  setJsonFields({ ...jsonFields, vial_options: e.target.value })
                }
                rows={6}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 font-mono text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Compliance Flags (JSON)
              </label>
              <textarea
                value={jsonFields.compliance_flags}
                onChange={(e) =>
                  setJsonFields({
                    ...jsonFields,
                    compliance_flags: e.target.value,
                  })
                }
                rows={4}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 font-mono text-sm"
              />
            </div>
          </div>
        </Section>

        <Section id="json" title="Additional JSON Data">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Health Info (JSON)
              </label>
              <textarea
                value={jsonFields.health_info}
                onChange={(e) =>
                  setJsonFields({ ...jsonFields, health_info: e.target.value })
                }
                rows={6}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Education Details (JSON)
              </label>
              <textarea
                value={jsonFields.education_details}
                onChange={(e) =>
                  setJsonFields({
                    ...jsonFields,
                    education_details: e.target.value,
                  })
                }
                rows={4}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Immediate Family History (JSON)
              </label>
              <textarea
                value={jsonFields.immediate_family_history}
                onChange={(e) =>
                  setJsonFields({
                    ...jsonFields,
                    immediate_family_history: e.target.value,
                  })
                }
                rows={6}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Paternal Family History (JSON)
              </label>
              <textarea
                value={jsonFields.paternal_family_history}
                onChange={(e) =>
                  setJsonFields({
                    ...jsonFields,
                    paternal_family_history: e.target.value,
                  })
                }
                rows={6}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Maternal Family History (JSON)
              </label>
              <textarea
                value={jsonFields.maternal_family_history}
                onChange={(e) =>
                  setJsonFields({
                    ...jsonFields,
                    maternal_family_history: e.target.value,
                  })
                }
                rows={6}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Health & Diseases (JSON)
              </label>
              <textarea
                value={jsonFields.health_diseases}
                onChange={(e) =>
                  setJsonFields({ ...jsonFields, health_diseases: e.target.value })
                }
                rows={8}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 font-mono text-sm"
              />
            </div>
          </div>
        </Section>

        <Section id="metadata" title="Metadata">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Document ID
              </label>
              <input
                type="text"
                value={formData.document_id}
                onChange={(e) =>
                  setFormData({ ...formData, document_id: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Source URL
              </label>
              <input
                type="url"
                value={formData.source_url}
                onChange={(e) =>
                  setFormData({ ...formData, source_url: e.target.value })
                }
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
        </Section>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-navy-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-navy-200 rounded-lg text-navy-700 hover:bg-navy-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Donor"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
