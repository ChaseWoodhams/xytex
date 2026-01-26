"use client";

import { useState, useEffect } from "react";
import { Search, Play, Clock, CheckCircle2, XCircle, AlertCircle, MapPin, Building2, Users, Phone, Mail, Globe, Link as LinkIcon, RefreshCw, X, Database } from "lucide-react";
import type { LocationScrapingJob, LocationScrapingResult, Location } from "@/lib/supabase/types";
import LocationMatchingModal from "./LocationMatchingModal";
import ApplyUpdatesModal from "./ApplyUpdatesModal";

export default function LocationScrapingTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(["google_maps"]);
  const [jobs, setJobs] = useState<LocationScrapingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [results, setResults] = useState<LocationScrapingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [matchingResult, setMatchingResult] = useState<LocationScrapingResult | null>(null);
  const [applyingResult, setApplyingResult] = useState<LocationScrapingResult | null>(null);
  
  // Location selection for scraping existing locations
  const [searchMode, setSearchMode] = useState<"manual" | "location">("manual");
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  // Auto-refresh running jobs every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadJobs().then(() => {
        // After loading jobs, refresh results if viewing a running job
        if (selectedJob) {
          // Get updated job status
          fetch("/api/admin/location-scraping/jobs?limit=50")
            .then(res => res.json())
            .then(data => {
              const job = data.jobs?.find((j: LocationScrapingJob) => j.id === selectedJob);
              if (job && (job.status === 'running' || job.status === 'pending')) {
                loadJobResults(selectedJob);
              }
            });
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedJob]);

  useEffect(() => {
    if (selectedJob) {
      loadJobResults(selectedJob);
    }
  }, [selectedJob]);

  const loadJobs = async () => {
    try {
      const response = await fetch("/api/admin/location-scraping/jobs?limit=50");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
    }
  };

  const loadJobResults = async (jobId: string) => {
    setIsLoadingResults(true);
    try {
      const response = await fetch(`/api/admin/location-scraping/results?job_id=${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        console.error("Failed to load results:", response.statusText);
        setResults([]);
      }
    } catch (error) {
      console.error("Error loading results:", error);
      setResults([]);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const loadLocations = async (query: string) => {
    if (query.length < 2) {
      setAvailableLocations([]);
      return;
    }
    
    setIsLoadingLocations(true);
    try {
      const response = await fetch(`/api/admin/locations?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableLocations(data.slice(0, 10) || []);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  useEffect(() => {
    if (locationSearchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        loadLocations(locationSearchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setAvailableLocations([]);
    }
  }, [locationSearchQuery]);

  const handleStartScraping = async () => {
    let queryToUse = searchQuery;
    let locationId: string | undefined = undefined;

    if (searchMode === "location") {
      if (!selectedLocation) {
        alert("Please select a location to scrape");
        return;
      }
      // Build search query from location data
      const locationParts: string[] = [];
      if (selectedLocation.name) locationParts.push(selectedLocation.name);
      if (selectedLocation.address_line1) locationParts.push(selectedLocation.address_line1);
      if (selectedLocation.city) locationParts.push(selectedLocation.city);
      if (selectedLocation.state) locationParts.push(selectedLocation.state);
      queryToUse = locationParts.join(", ");
      locationId = selectedLocation.id;
    } else {
      if (!searchQuery.trim()) {
        alert("Please enter a search query");
        return;
      }
    }

    if (selectedSources.length === 0) {
      alert("Please select at least one source");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/location-scraping/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryToUse,
          sources: selectedSources,
          locationId: locationId, // Pass location ID so we can auto-match results
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start scraping");
      }

      const data = await response.json();
      alert(`Scraping job started! Job ID: ${data.jobId}`);
      setSearchQuery("");
      setSelectedLocation(null);
      setLocationSearchQuery("");
      await loadJobs();
    } catch (error: any) {
      alert(`Failed to start scraping: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
          Pending
        </span>
      ),
      running: (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
          Running
        </span>
      ),
      completed: (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
          Completed
        </span>
      ),
      failed: (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
          Failed
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "google_maps":
        return <MapPin className="w-4 h-4" />;
      case "linkedin":
        return <LinkIcon className="w-4 h-4" />;
      case "website":
        return <Globe className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-semibold text-navy-900 mb-1">
          Location Scraping
        </h2>
        <p className="text-navy-600">
          Scrape location data from Google Maps, LinkedIn, and websites
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg border border-navy-200 p-6">
        <h3 className="text-lg font-heading font-semibold text-navy-900 mb-4">
          Start New Scraping Job
        </h3>
        
        {/* Search Mode Toggle */}
        <div className="mb-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchMode"
                value="manual"
                checked={searchMode === "manual"}
                onChange={(e) => {
                  setSearchMode("manual");
                  setSelectedLocation(null);
                  setLocationSearchQuery("");
                }}
                className="w-4 h-4 text-gold-600 border-navy-300 focus:ring-gold-500"
              />
              <span className="text-sm font-medium text-navy-700">Manual Search</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchMode"
                value="location"
                checked={searchMode === "location"}
                onChange={(e) => {
                  setSearchMode("location");
                  setSearchQuery("");
                }}
                className="w-4 h-4 text-gold-600 border-navy-300 focus:ring-gold-500"
              />
              <span className="text-sm font-medium text-navy-700 flex items-center gap-1">
                <Database className="w-4 h-4" />
                Select Existing Location
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          {searchMode === "manual" ? (
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., 'Fertility Clinic New York' or 'https://example.com'"
                className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">
                Search Locations
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input
                  type="text"
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  placeholder="Search by location name, address, or phone..."
                  className="w-full pl-10 pr-4 py-2 border border-navy-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                />
              </div>
              
              {/* Location Results */}
              {isLoadingLocations && (
                <div className="mt-2 text-sm text-navy-600">Searching locations...</div>
              )}
              
              {!isLoadingLocations && locationSearchQuery.length >= 2 && availableLocations.length > 0 && (
                <div className="mt-2 border border-navy-200 rounded-lg max-h-60 overflow-y-auto">
                  {availableLocations.map((location) => (
                    <div
                      key={location.id}
                      onClick={() => {
                        setSelectedLocation(location);
                        setLocationSearchQuery(location.name);
                        setAvailableLocations([]);
                      }}
                      className={`p-3 border-b border-navy-100 last:border-b-0 cursor-pointer hover:bg-navy-50 transition-colors ${
                        selectedLocation?.id === location.id ? "bg-gold-50 border-gold-200" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-navy-900">{location.name}</p>
                          {location.address_line1 && (
                            <p className="text-sm text-navy-600">
                              {location.address_line1}
                              {location.city && `, ${location.city}`}
                              {location.state && ` ${location.state}`}
                            </p>
                          )}
                          {location.phone && (
                            <p className="text-sm text-navy-600">{location.phone}</p>
                          )}
                        </div>
                        {selectedLocation?.id === location.id && (
                          <CheckCircle2 className="w-5 h-5 text-gold-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedLocation && (
                <div className="mt-3 p-3 bg-gold-50 border border-gold-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-navy-900 mb-1">Selected Location:</p>
                      <p className="text-sm text-navy-700">{selectedLocation.name}</p>
                      {selectedLocation.address_line1 && (
                        <p className="text-sm text-navy-600">
                          {selectedLocation.address_line1}
                          {selectedLocation.city && `, ${selectedLocation.city}`}
                          {selectedLocation.state && ` ${selectedLocation.state}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLocation(null);
                        setLocationSearchQuery("");
                      }}
                      className="p-1 text-navy-600 hover:text-navy-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Sources
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: "google_maps", label: "Google Maps" },
                { value: "linkedin", label: "LinkedIn" },
                { value: "website", label: "Website" },
              ].map((source) => (
                <label key={source.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(source.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSources([...selectedSources, source.value]);
                      } else {
                        setSelectedSources(selectedSources.filter((s) => s !== source.value));
                      }
                    }}
                    className="w-4 h-4 text-gold-600 border-navy-300 rounded focus:ring-gold-500"
                  />
                  <span className="text-sm text-navy-700">{source.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={handleStartScraping}
            disabled={isLoading || (searchMode === "manual" ? !searchQuery.trim() : !selectedLocation) || selectedSources.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-navy-800 text-white rounded-lg hover:bg-navy-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            {isLoading ? "Starting..." : searchMode === "location" ? "Scrape Location" : "Start Scraping"}
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg border border-navy-200 p-6">
        <h3 className="text-lg font-heading font-semibold text-navy-900 mb-4">
          Scraping Jobs
        </h3>
        {jobs.length === 0 ? (
          <p className="text-navy-600">No scraping jobs yet. Start a new job above.</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job.id === selectedJob ? null : job.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedJob === job.id
                    ? "border-gold-500 bg-gold-50"
                    : "border-navy-200 hover:border-navy-300"
                }`}
                title={selectedJob === job.id ? "Click to hide results" : "Click to view results"}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-navy-900">{job.search_query}</h4>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-navy-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(job.created_at).toLocaleString()}
                      </span>
                      <span>Results: {job.results_count}</span>
                      <span>Source: {job.source}</span>
                    </div>
                    {job.error_message && (
                      <p className="text-sm text-red-600 mt-2">{job.error_message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results View */}
      {selectedJob && (
        <div className="bg-white rounded-lg border border-navy-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-navy-900">
              Scraping Results
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => selectedJob && loadJobResults(selectedJob)}
                disabled={isLoadingResults}
                className="p-2 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh results"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingResults ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setResults([]);
                }}
                className="p-2 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors"
                title="Close results"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {isLoadingResults ? (
            <div className="text-center py-8 text-navy-600">
              Loading results...
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-navy-600">
              <p className="mb-2">No results found for this job yet.</p>
              <p className="text-sm">
                {jobs.find(j => j.id === selectedJob)?.status === 'running' 
                  ? 'Job is still running. Results will appear here when available.'
                  : 'This job may not have found any results, or the scraping is still in progress.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-navy-600 mb-4">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((result) => (
              <div
                key={result.id}
                className="border border-navy-200 rounded-lg p-4 hover:border-navy-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSourceIcon(result.source)}
                      <h4 className="font-medium text-navy-900">
                        {result.business_name || "Unknown Business"}
                      </h4>
                      <span className="text-xs text-navy-500 capitalize">{result.source}</span>
                      {result.matched_location_id && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Auto-matched
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-navy-600">
                      {result.address_line1 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>
                            {result.address_line1}
                            {result.address_line2 && `, ${result.address_line2}`}
                            {result.city && `, ${result.city}`}
                            {result.state && ` ${result.state}`}
                            {result.zip_code && ` ${result.zip_code}`}
                          </span>
                        </div>
                      )}
                      {result.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{result.phone}</span>
                        </div>
                      )}
                      {result.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span>{result.email}</span>
                        </div>
                      )}
                      {result.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 flex-shrink-0" />
                          <a
                            href={result.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {result.website}
                          </a>
                        </div>
                      )}
                      {result.employees && result.employees.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span>{result.employees.length} employees found</span>
                        </div>
                      )}
                      {result.rating && (
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-600">★</span>
                          <span>{result.rating} {result.review_count ? `(${result.review_count} reviews)` : ''}</span>
                        </div>
                      )}
                      {result.categories && result.categories.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-navy-500">
                            {result.categories.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {result.matched_location_id ? (
                      <>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded text-center">
                          Matched
                        </span>
                        <button
                          onClick={() => setApplyingResult(result)}
                          className="px-3 py-1 text-sm bg-gold-600 text-white rounded hover:bg-gold-700 transition-colors whitespace-nowrap"
                        >
                          Apply Updates
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setMatchingResult(result)}
                        className="px-3 py-1 text-sm bg-navy-800 text-white rounded hover:bg-navy-900 transition-colors whitespace-nowrap"
                      >
                        Match
                      </button>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {matchingResult && (
        <LocationMatchingModal
          result={matchingResult}
          onClose={() => setMatchingResult(null)}
          onMatch={async (locationId, accountId) => {
            try {
              const response = await fetch("/api/admin/location-scraping/results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resultId: matchingResult.id,
                  locationId,
                  accountId,
                }),
              });

              if (response.ok) {
                await loadJobResults(selectedJob!);
                setMatchingResult(null);
              } else {
                const error = await response.json();
                alert(`Failed to match: ${error.error}`);
              }
            } catch (error: any) {
              alert(`Failed to match: ${error.message}`);
            }
          }}
        />
      )}

      {applyingResult && (
        <ApplyUpdatesModal
          result={applyingResult}
          locationId={applyingResult.matched_location_id!}
          onClose={() => setApplyingResult(null)}
          onApply={async (fields) => {
            try {
              const response = await fetch(
                `/api/admin/location-scraping/results/${applyingResult.id}/apply`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    locationId: applyingResult.matched_location_id,
                    fields,
                  }),
                }
              );

              if (response.ok) {
                alert("Updates applied successfully!");
                setApplyingResult(null);
                // Reload results to show updated data
                await loadJobResults(selectedJob!);
              } else {
                const error = await response.json();
                alert(`Failed to apply updates: ${error.error}`);
              }
            } catch (error: any) {
              alert(`Failed to apply updates: ${error.message}`);
            }
          }}
        />
      )}
    </div>
  );
}
