"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Location, Account, Agreement, LocationVialSale, User } from "@/lib/supabase/types";
import { ArrowLeft, MapPin, Building2, FileText, Trash2, Upload, Download, X, Shield, Eye, Plus, Package } from "lucide-react";
import AgreementsList from "./AgreementsList";
import LocationContacts from "./LocationContacts";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";

interface LocationDetailViewProps {
  location: Location;
  account: Account;
  agreements: Agreement[];
  isMultiLocation: boolean;
}

export default function LocationDetailView({
  location: initialLocation,
  account,
  agreements,
  isMultiLocation,
}: LocationDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "agreements" | "license">("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState<string | null>(initialLocation.agreement_document_url);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [uploadLicenseError, setUploadLicenseError] = useState<string | null>(null);
  const [currentLicenseUrl, setCurrentLicenseUrl] = useState<string | null>(initialLocation.license_document_url);
  const [viewingLicensePdf, setViewingLicensePdf] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const licenseFileInputRef = useRef<HTMLInputElement>(null);
  
  // Vial tracking state
  const [location, setLocation] = useState<Location>(initialLocation);
  const [vialSales, setVialSales] = useState<LocationVialSale[]>([]);
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
  const [isLoadingVials, setIsLoadingVials] = useState(false);
  const [isAddingVials, setIsAddingVials] = useState(false);
  const [vialsInput, setVialsInput] = useState<string>("");
  const [vialsNotes, setVialsNotes] = useState<string>("");
  const [vialsError, setVialsError] = useState<string | null>(null);

  // Only show agreements and license tabs if this is a multi-location account
  // For single-location accounts, these tabs are on the account page
  // Use account_type or fallback to isMultiLocation flag
  const shouldShowAgreements = account.account_type === 'multi_location' || isMultiLocation;
  const tabs = [
    { id: "overview", label: "Overview", icon: MapPin },
    ...(shouldShowAgreements ? [{ id: "license" as const, label: "License", icon: Shield }] : []),
    ...(shouldShowAgreements ? [{ id: "agreements" as const, label: "Agreements", icon: FileText }] : []),
  ];

  // Fetch vial sales and user information
  useEffect(() => {
    const fetchVialSales = async () => {
      setIsLoadingVials(true);
      try {
        const response = await fetch(`/api/admin/locations/${location.id}/vials`);
        if (response.ok) {
          const sales: LocationVialSale[] = await response.json();
          setVialSales(sales);
          
          // Fetch user information for each unique user ID
          const uniqueUserIds = [...new Set(sales.map(sale => sale.entered_by))];
          const supabase = createSupabaseBrowserClient();
          const userPromises = uniqueUserIds.map(async (userId) => {
            const { data } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();
            return data ? { id: userId, user: data } : null;
          });
          
          const userResults = await Promise.all(userPromises);
          const newUserMap = new Map<string, User>();
          userResults.forEach(result => {
            if (result) {
              newUserMap.set(result.id, result.user);
            }
          });
          setUserMap(newUserMap);
        }
      } catch (error) {
        console.error('Error fetching vial sales:', error);
      } finally {
        setIsLoadingVials(false);
      }
    };
    
    fetchVialSales();
  }, [location.id]);

  // Handle adding vials
  const handleAddVials = async (e: React.FormEvent) => {
    e.preventDefault();
    setVialsError(null);
    
    const vialsCount = parseInt(vialsInput, 10);
    if (!vialsInput || isNaN(vialsCount) || vialsCount < 1) {
      setVialsError('Please enter a valid number of vials (minimum 1)');
      return;
    }

    setIsAddingVials(true);
    try {
      const response = await fetch(`/api/admin/locations/${location.id}/vials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vials: vialsCount,
          notes: vialsNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || 'Failed to add vials';
        console.error('API Error:', errorMessage, error);
        throw new Error(errorMessage);
      }

      const newSale = await response.json();
      
      // Refresh vial sales list
      const refreshResponse = await fetch(`/api/admin/locations/${location.id}/vials`);
      if (refreshResponse.ok) {
        const sales: LocationVialSale[] = await refreshResponse.json();
        setVialSales(sales);
        
        // Update location total_vials_sold
        setLocation(prev => ({
          ...prev,
          total_vials_sold: (prev.total_vials_sold || 0) + vialsCount,
        }));
        
        // Fetch user info for the new sale if needed
        if (!userMap.has(newSale.entered_by)) {
          const supabase = createSupabaseBrowserClient();
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', newSale.entered_by)
            .single();
          if (data) {
            setUserMap(prev => new Map(prev).set(newSale.entered_by, data));
          }
        }
      }

      // Reset form
      setVialsInput("");
      setVialsNotes("");
      router.refresh();
    } catch (error: any) {
      console.error('Error adding vials:', error);
      setVialsError(error.message || 'Failed to add vials');
    } finally {
      setIsAddingVials(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are allowed');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1) Upload file directly to Supabase Storage from the browser
      const supabase = createSupabaseBrowserClient();
      const fileExt = file.name.split('.').pop() || 'pdf';
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const storageFileName = `${baseName}-${uniqueId}.${fileExt}`;
      const filePath = `location-agreements/location-${location.id}-${storageFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('agreements')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'application/pdf',
        });

      if (uploadError) {
        console.error('Error uploading location agreement PDF to Supabase Storage:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload document to storage');
      }

      const { data: urlData } = supabase.storage
        .from('agreements')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to generate public URL for uploaded document');
      }

      const documentUrl = urlData.publicUrl;

      // 2) Call lightweight API route to record agreement metadata in the database
      const response = await fetch(`/api/admin/locations/${location.id}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_url: documentUrl,
          file_name: file.name,
          signed_date: null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record agreement metadata');
      }

      const data = await response.json();
      setCurrentDocumentUrl(data.document_url);
      router.refresh();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      setUploadError(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveDocument = async () => {
    if (!confirm('Are you sure you want to remove this agreement document?')) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Update location to remove document URL
      const response = await fetch(`/api/admin/locations/${location.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agreement_document_url: null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove document');
      }

      setCurrentDocumentUrl(null);
      router.refresh();
    } catch (error: any) {
      console.error('Error removing document:', error);
      setUploadError(error.message || 'Failed to remove document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLicenseFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadLicenseError('Only PDF files are allowed');
      return;
    }

    setIsUploadingLicense(true);
    setUploadLicenseError(null);

    try {
      // 1) Upload license PDF directly to Supabase Storage from the browser
      const supabase = createSupabaseBrowserClient();
      const fileExt = file.name.split('.').pop() || 'pdf';
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const storageFileName = `${baseName}-${uniqueId}.${fileExt}`;
      const filePath = `location-licenses/license-${location.id}-${storageFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('agreements')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'application/pdf',
        });

      if (uploadError) {
        console.error('Error uploading location license PDF to Supabase Storage:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload license document to storage');
      }

      const { data: urlData } = supabase.storage
        .from('agreements')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to generate public URL for uploaded license document');
      }

      const documentUrl = urlData.publicUrl;

      // 2) Update location with new license URL via existing PATCH endpoint
      const response = await fetch(`/api/admin/locations/${location.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_document_url: documentUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update license document URL');
      }

      setCurrentLicenseUrl(documentUrl);
      router.refresh();
    } catch (error: any) {
      console.error('Error uploading license document:', error);
      setUploadLicenseError(error.message || 'Failed to upload license document');
    } finally {
      setIsUploadingLicense(false);
      if (licenseFileInputRef.current) {
        licenseFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLicense = async () => {
    if (!confirm('Are you sure you want to remove this license document?')) {
      return;
    }

    setIsUploadingLicense(true);
    setUploadLicenseError(null);

    try {
      // Update location to remove license document URL
      const response = await fetch(`/api/admin/locations/${location.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_document_url: null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove license document');
      }

      setCurrentLicenseUrl(null);
      router.refresh();
    } catch (error: any) {
      console.error('Error removing license document:', error);
      setUploadLicenseError(error.message || 'Failed to remove license document');
    } finally {
      setIsUploadingLicense(false);
    }
  };

  return (
    <div className="p-8">
      <Link
        href={`/admin/accounts/${account.id}`}
        className="inline-flex items-center gap-2 text-navy-600 hover:text-navy-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Account
      </Link>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-heading font-bold text-navy-900">
            {location.name}
          </h1>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Location
          </button>
        </div>
        <div className="flex items-center gap-4">
          {location.is_primary && (
            <span className="px-3 py-1 text-sm font-semibold bg-gold-100 text-gold-800 rounded-full">
              Primary Location
            </span>
          )}
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              location.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {location.status}
          </span>
          <Link
            href={`/admin/accounts/${account.id}`}
            className="text-sm text-navy-600 hover:text-gold-600"
          >
            <Building2 className="w-4 h-4 inline mr-1" />
            {account.name}
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-navy-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-gold-600 text-gold-600"
                    : "border-transparent text-navy-600 hover:text-navy-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Location Contacts - Show at top */}
            <LocationContacts locationId={location.id} />

            {/* Vials Sold Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-gold-600" />
                Vials Sold
              </h2>
              
              {/* Total Vials Display */}
              <div className="mb-6">
                <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
                  <div className="text-sm text-navy-600 uppercase tracking-wide mb-1">Total Vials Sold</div>
                  <div className="text-4xl font-bold text-navy-900">{location.total_vials_sold || 0}</div>
                </div>
              </div>

              {/* Add Vials Form */}
              <form onSubmit={handleAddVials} className="mb-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vials-count" className="block text-sm font-medium text-navy-700 mb-2">
                      Number of Vials *
                    </label>
                    <input
                      id="vials-count"
                      type="number"
                      min="1"
                      value={vialsInput}
                      onChange={(e) => setVialsInput(e.target.value)}
                      disabled={isAddingVials}
                      className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter number of vials"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="vials-notes" className="block text-sm font-medium text-navy-700 mb-2">
                      Notes (Optional)
                    </label>
                    <input
                      id="vials-notes"
                      type="text"
                      value={vialsNotes}
                      onChange={(e) => setVialsNotes(e.target.value)}
                      disabled={isAddingVials}
                      className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Add any notes"
                    />
                  </div>
                </div>
                {vialsError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{vialsError}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isAddingVials}
                  className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  {isAddingVials ? 'Adding...' : 'Add Vials'}
                </button>
              </form>

              {/* Vial Sales History */}
              <div>
                <h3 className="text-lg font-heading font-semibold text-navy-900 mb-4">Sales History</h3>
                {isLoadingVials ? (
                  <div className="text-center py-8 text-navy-600">Loading sales history...</div>
                ) : vialSales.length === 0 ? (
                  <div className="text-center py-8 text-navy-600">No vial sales recorded yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-navy-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">Date/Time</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">Vials Added</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">Entered By</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vialSales.map((sale) => {
                          const user = userMap.get(sale.entered_by);
                          return (
                            <tr key={sale.id} className="border-b border-navy-100 hover:bg-navy-50">
                              <td className="py-3 px-4 text-sm text-navy-900">{formatDate(sale.entered_at)}</td>
                              <td className="py-3 px-4 text-sm font-medium text-navy-900">{sale.vials_added}</td>
                              <td className="py-3 px-4 text-sm text-navy-700">
                                {user?.full_name || user?.email || 'Unknown User'}
                              </td>
                              <td className="py-3 px-4 text-sm text-navy-600">{sale.notes || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Location Codes */}
        {(location.clinic_code || location.sage_code) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
              Location Codes
            </h2>
            <dl className="grid md:grid-cols-2 gap-4">
              {location.clinic_code && (
                <div>
                  <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Clinic Code</dt>
                  <dd className="text-sm text-navy-900 font-medium">{location.clinic_code}</dd>
                </div>
              )}
              {location.sage_code && (
                <div>
                  <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Sage Code</dt>
                  <dd className="text-sm text-navy-900 font-medium">{location.sage_code}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Location Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gold-600" />
            Location Information
          </h2>
          <dl className="space-y-3">
            {(location.address_line1 || location.address_line2) && (
              <div>
                <dt className="text-sm text-navy-600">Address</dt>
                <dd className="text-navy-900">
                  {location.address_line1}
                  {location.address_line2 && `, ${location.address_line2}`}
                </dd>
              </div>
            )}
            {(location.city || location.state || location.zip_code) && (
              <div>
                <dt className="text-sm text-navy-600">City, State, ZIP</dt>
                <dd className="text-navy-900">
                  {[location.city, location.state, location.zip_code]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </div>
            )}
            {location.country && (
              <div>
                <dt className="text-sm text-navy-600">Country</dt>
                <dd className="text-navy-900">{location.country}</dd>
              </div>
            )}
            {location.phone && (
              <div>
                <dt className="text-sm text-navy-600">Phone</dt>
                <dd className="text-navy-900">
                  <a
                    href={`tel:${location.phone}`}
                    className="text-gold-600 hover:text-gold-700"
                  >
                    {location.phone}
                  </a>
                </dd>
              </div>
            )}
            {location.email && (
              <div>
                <dt className="text-sm text-navy-600">Email</dt>
                <dd className="text-navy-900">
                  <a
                    href={`mailto:${location.email}`}
                    className="text-gold-600 hover:text-gold-700"
                  >
                    {location.email}
                  </a>
                </dd>
              </div>
            )}
            {location.contact_name && (
              <div>
                <dt className="text-sm text-navy-600">Contact Name</dt>
                <dd className="text-navy-900">
                  {location.contact_name}
                  {location.contact_title && ` (${location.contact_title})`}
                </dd>
              </div>
            )}
            {location.notes && (
              <div>
                <dt className="text-sm text-navy-600">Notes</dt>
                <dd className="text-navy-700 whitespace-pre-wrap">{location.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Location Agreement Document */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold-600" />
            Location Agreement
          </h2>
          
          {currentDocumentUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-navy-600" />
                  <div>
                    <p className="text-sm font-medium text-navy-900">Agreement Document</p>
                    <p className="text-xs text-navy-600">PDF document uploaded</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={currentDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-sm bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    View Document
                  </a>
                  <button
                    onClick={handleRemoveDocument}
                    disabled={isUploading}
                    className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  Replace Document
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm bg-navy-100 text-navy-700 rounded-lg hover:bg-navy-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Upload New Document'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-navy-600">
                Upload a location-level agreement document (PDF format)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload Agreement Document'}
              </button>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
          )}
        </div>

        {/* Account UDF Information */}
        {(account.sage_code || account.udf_clinic_name || account.udf_shipto_name || account.udf_country_code) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold-600" />
              Account Information
            </h2>
            <dl className="space-y-3 grid md:grid-cols-2 gap-4">
              {account.sage_code && (
                <div>
                  <dt className="text-sm text-navy-600">Sage Code</dt>
                  <dd className="text-navy-900">{account.sage_code}</dd>
                </div>
              )}
              {account.udf_clinic_name && (
                <div>
                  <dt className="text-sm text-navy-600">Clinic Name</dt>
                  <dd className="text-navy-900">{account.udf_clinic_name}</dd>
                </div>
              )}
              {account.udf_shipto_name && (
                <div>
                  <dt className="text-sm text-navy-600">Shipto Name</dt>
                  <dd className="text-navy-900">{account.udf_shipto_name}</dd>
                </div>
              )}
              {account.udf_country_code && (
                <div>
                  <dt className="text-sm text-navy-600">Country Code</dt>
                  <dd className="text-navy-900">{account.udf_country_code}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Account Address Information */}
        {(account.udf_address_line1 || account.udf_address_line2 || account.udf_address_line3 || account.udf_city || account.udf_state || account.udf_zipcode) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
              Account Address Information
            </h2>
            <dl className="space-y-3">
              {account.udf_address_line1 && (
                <div>
                  <dt className="text-sm text-navy-600">Address Line 1</dt>
                  <dd className="text-navy-900">{account.udf_address_line1}</dd>
                </div>
              )}
              {account.udf_address_line2 && (
                <div>
                  <dt className="text-sm text-navy-600">Address Line 2</dt>
                  <dd className="text-navy-900">{account.udf_address_line2}</dd>
                </div>
              )}
              {account.udf_address_line3 && (
                <div>
                  <dt className="text-sm text-navy-600">Address Line 3</dt>
                  <dd className="text-navy-900">{account.udf_address_line3}</dd>
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-4">
                {account.udf_city && (
                  <div>
                    <dt className="text-sm text-navy-600">City</dt>
                    <dd className="text-navy-900">{account.udf_city}</dd>
                  </div>
                )}
                {account.udf_state && (
                  <div>
                    <dt className="text-sm text-navy-600">State</dt>
                    <dd className="text-navy-900">{account.udf_state}</dd>
                  </div>
                )}
                {account.udf_zipcode && (
                  <div>
                    <dt className="text-sm text-navy-600">Zipcode</dt>
                    <dd className="text-navy-900">{account.udf_zipcode}</dd>
                  </div>
                )}
              </div>
            </dl>
          </div>
        )}

        {/* Account Contact Information */}
        {(account.udf_phone || account.udf_email || account.udf_fax) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
              Account Contact Information
            </h2>
            <dl className="space-y-3 grid md:grid-cols-3 gap-4">
              {account.udf_phone && (
                <div>
                  <dt className="text-sm text-navy-600">Phone</dt>
                  <dd className="text-navy-900">
                    <a
                      href={`tel:${account.udf_phone}`}
                      className="text-gold-600 hover:text-gold-700"
                    >
                      {account.udf_phone}
                    </a>
                  </dd>
                </div>
              )}
              {account.udf_email && (
                <div>
                  <dt className="text-sm text-navy-600">Email</dt>
                  <dd className="text-navy-900">
                    <a
                      href={`mailto:${account.udf_email}`}
                      className="text-gold-600 hover:text-gold-700"
                    >
                      {account.udf_email}
                    </a>
                  </dd>
                </div>
              )}
              {account.udf_fax && (
                <div>
                  <dt className="text-sm text-navy-600">Fax</dt>
                  <dd className="text-navy-900">{account.udf_fax}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Account Additional Notes */}
        {account.udf_notes && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
              Account Additional Notes
            </h2>
            <p className="text-navy-700 whitespace-pre-wrap">{account.udf_notes}</p>
          </div>
        )}
          </div>
        )}

        {activeTab === "license" && shouldShowAgreements && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-semibold text-navy-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-gold-600" />
                Location License
              </h2>
            </div>
            
            {currentLicenseUrl ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-navy-600" />
                    <div>
                      <p className="text-sm font-medium text-navy-900">License Document</p>
                      <p className="text-xs text-navy-600">PDF document uploaded</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingLicensePdf(currentLicenseUrl)}
                      className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                      title="View PDF"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={currentLicenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={handleRemoveLicense}
                      disabled={isUploadingLicense}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove License"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    Replace License Document
                  </label>
                  <input
                    ref={licenseFileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleLicenseFileSelect}
                    disabled={isUploadingLicense}
                    className="hidden"
                  />
                  <button
                    onClick={() => licenseFileInputRef.current?.click()}
                    disabled={isUploadingLicense}
                    className="px-4 py-2 text-sm bg-navy-100 text-navy-700 rounded-lg hover:bg-navy-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploadingLicense ? 'Uploading...' : 'Upload New License'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-navy-600">
                  Upload a location license document (PDF format)
                </p>
                <input
                  ref={licenseFileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleLicenseFileSelect}
                  disabled={isUploadingLicense}
                  className="hidden"
                />
                <button
                  onClick={() => licenseFileInputRef.current?.click()}
                  disabled={isUploadingLicense}
                  className="px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingLicense ? 'Uploading...' : 'Upload License Document'}
                </button>
              </div>
            )}

            {uploadLicenseError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{uploadLicenseError}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "agreements" && shouldShowAgreements && (
          <AgreementsList
            accountId={account.id}
            locationId={location.id}
            agreements={agreements}
          />
        )}
      </div>

      {/* License PDF Viewer Modal */}
      {viewingLicensePdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-navy-200">
              <h3 className="text-lg font-heading font-semibold text-navy-900">
                License Document
              </h3>
              <button
                onClick={() => setViewingLicensePdf(null)}
                className="p-2 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={viewingLicensePdf}
                className="w-full h-full border-0"
                title="License PDF Viewer"
              />
            </div>
            <div className="p-4 border-t border-navy-200 flex items-center justify-between">
              <a
                href={viewingLicensePdf}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
              <button
                onClick={() => setViewingLicensePdf(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            const response = await fetch(`/api/admin/locations/${location.id}`, {
              method: 'DELETE',
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to delete location');
            }

            // Redirect to account page after successful deletion
            router.push(`/admin/accounts/${account.id}`);
            router.refresh();
          } catch (error: any) {
            console.error('Error deleting location:', error);
            alert(`Failed to delete location: ${error.message}`);
            setIsDeleting(false);
          }
        }}
        title="Delete Location"
        message="Are you sure you want to delete this location? This will also delete all associated agreements."
        itemName={location.name}
        isLoading={isDeleting}
      />
    </div>
  );
}

