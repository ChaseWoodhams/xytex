"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { LocationContact, ContactRole } from "@/lib/supabase/types";
import { UserPlus, Mail, Phone, Edit, Trash2, X, Save, User } from "lucide-react";

interface LocationContactsProps {
  locationId: string;
  initialShowForm?: boolean;
  showModal?: boolean;
  onModalClose?: () => void;
  hideHeader?: boolean;
  onContactsLoaded?: (count: number) => void;
}

const CONTACT_ROLES: { value: ContactRole; label: string }[] = [
  { value: 'primary', label: 'Primary Contact' },
  { value: 'clinic_manager', label: 'Clinic Manager' },
  { value: 'lab_director', label: 'Lab Director' },
  { value: 'nurse_coordinator', label: 'Nurse Coordinator' },
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'billing', label: 'Billing' },
  { value: 'clinical', label: 'Clinical Staff' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'other', label: 'Other' },
];

export default function LocationContacts({ locationId, initialShowForm = false, showModal = false, onModalClose, hideHeader = false, onContactsLoaded }: LocationContactsProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<LocationContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [isModalOpen, setIsModalOpen] = useState(showModal);
  const [editingContact, setEditingContact] = useState<LocationContact | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'primary' as ContactRole,
    title: '',
    is_primary: false,
    notes: '',
  });

  useEffect(() => {
    fetchContacts();
  }, [locationId]);

  useEffect(() => {
    if (initialShowForm) {
      setShowForm(true);
    }
  }, [initialShowForm]);

  useEffect(() => {
    if (showModal) {
      setIsModalOpen(true);
      setShowForm(true);
      setEditingContact(null);
      resetForm();
    } else if (!showModal && isModalOpen) {
      // Only close if modal was opened via prop
      setIsModalOpen(false);
      setShowForm(false);
    }
  }, [showModal]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/locations/${locationId}/contacts`);
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      const data = await response.json();
      setContacts(data);
      onContactsLoaded?.(data.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const url = editingContact
        ? `/api/admin/locations/${locationId}/contacts/${editingContact.id}`
        : `/api/admin/locations/${locationId}/contacts`;
      
      const method = editingContact ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          email: formData.email || null,
          phone: formData.phone || null,
          title: formData.title || null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save contact');
      }

      setShowForm(false);
      setEditingContact(null);
      resetForm();
      fetchContacts();
      router.refresh();
      
      // Close modal if it was opened via modal
      if (isModalOpen) {
        setIsModalOpen(false);
        onModalClose?.();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (contact: LocationContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      role: contact.role,
      title: contact.title || '',
      is_primary: contact.is_primary,
      notes: contact.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/locations/${locationId}/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      fetchContacts();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete contact');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'primary',
      title: '',
      is_primary: false,
      notes: '',
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingContact(null);
    resetForm();
    if (isModalOpen) {
      setIsModalOpen(false);
      onModalClose?.();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-navy-600">Loading contacts...</p>
      </div>
    );
  }

  const contactsContent = (
    <>
      {error && (
        <div className={`${hideHeader ? 'mb-4' : 'mb-6'} p-3 bg-red-50 border border-red-200 rounded-lg`}>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {showForm && !isModalOpen && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-navy-200 rounded-lg bg-navy-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-navy-900">
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 text-navy-600 hover:text-navy-900 hover:bg-navy-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-navy-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-navy-700 mb-1">
                Role *
              </label>
              <select
                id="role"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as ContactRole })}
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                {CONTACT_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-navy-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-navy-700 mb-1">
                Position in Clinic
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                className="w-4 h-4 text-gold-600 border-navy-300 rounded focus:ring-gold-500"
              />
              <label htmlFor="is_primary" className="text-sm font-medium text-navy-700">
                Primary Contact
              </label>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-navy-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
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
              className="btn btn-primary"
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : editingContact ? 'Update' : 'Add Contact'}
            </button>
          </div>
        </form>
      )}

      {contacts.length === 0 && !showForm ? (
        <div className={`text-center ${hideHeader ? 'py-6' : 'py-12'}`}>
          <User className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-4">No contacts added yet</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Add First Contact
          </button>
        </div>
      ) : (
        <div className={`${hideHeader ? 'space-y-3' : 'space-y-4'}`}>
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`border border-navy-200 rounded-lg ${hideHeader ? 'p-3' : 'p-4'} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-heading font-semibold text-navy-900">
                      {contact.name}
                    </h3>
                    {contact.is_primary && (
                      <span className="px-2 py-1 text-xs font-semibold bg-gold-100 text-gold-800 rounded-full">
                        Primary
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs font-semibold bg-navy-100 text-navy-800 rounded-full">
                      {CONTACT_ROLES.find(r => r.value === contact.role)?.label || contact.role}
                    </span>
                  </div>
                  
                  {contact.title && (
                    <p className="text-sm text-navy-600 mb-2">{contact.title}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-navy-600">
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1 text-gold-600 hover:text-gold-700"
                      >
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1 text-gold-600 hover:text-gold-700"
                      >
                        <Phone className="w-4 h-4" />
                        {contact.phone}
                      </a>
                    )}
                  </div>

                  {contact.notes && (
                    <p className="mt-2 text-sm text-navy-600">{contact.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                    title="Edit Contact"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 text-navy-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const modalForm = (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-navy-200">
          <h3 className="text-xl font-heading font-semibold text-navy-900">
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </h3>
          <button
            onClick={handleCancel}
            className="p-2 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-name" className="block text-sm font-medium text-navy-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="modal-name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label htmlFor="modal-role" className="block text-sm font-medium text-navy-700 mb-1">
                Role *
              </label>
              <select
                id="modal-role"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as ContactRole })}
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                {CONTACT_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="modal-email" className="block text-sm font-medium text-navy-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="modal-email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label htmlFor="modal-phone" className="block text-sm font-medium text-navy-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="modal-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label htmlFor="modal-title" className="block text-sm font-medium text-navy-700 mb-1">
                Position in Clinic
              </label>
              <input
                type="text"
                id="modal-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="modal-is_primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                className="w-4 h-4 text-gold-600 border-navy-300 rounded focus:ring-gold-500"
              />
              <label htmlFor="modal-is_primary" className="text-sm font-medium text-navy-700">
                Primary Contact
              </label>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="modal-notes" className="block text-sm font-medium text-navy-700 mb-1">
                Notes
              </label>
              <textarea
                id="modal-notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-navy-200">
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
              className="btn btn-primary"
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : editingContact ? 'Update' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (hideHeader) {
    return (
      <>
        {contactsContent}
        {isModalOpen && modalForm}
      </>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-semibold text-navy-900">
          Contacts
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <UserPlus className="w-5 h-5" />
            Add Contact
          </button>
        )}
      </div>
      
      {contactsContent}
      {isModalOpen && modalForm}
    </div>
  );
}
