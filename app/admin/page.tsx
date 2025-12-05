import { createClient } from "@/lib/supabase/server";
import { getCorporateAccounts } from "@/lib/supabase/corporate-accounts";
import { getAllLocations } from "@/lib/supabase/locations";
import { getLocationAgreementHealthByAccounts, getExpiringAgreements, getAgreementStatusesByLocations } from "@/lib/supabase/agreements";
import { Building2, AlertCircle, Calendar, ArrowRight, CheckCircle2, MapPin, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const accounts = await getCorporateAccounts();
  const allLocations = await getAllLocations();
  const accountIds = accounts.map(a => a.id);
  const accountHealth = await getLocationAgreementHealthByAccounts(accountIds);
  const expiringAgreements = await getExpiringAgreements(90);

  // Get agreement statuses for all locations to find those with no contract
  const locationIds = allLocations.map(l => l.id);
  const locationAgreementStatuses = await getAgreementStatusesByLocations(locationIds);

  // Calculate key metrics
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.status === "active").length;
  const totalLocations = allLocations.length;
  
  // Count locations with no contract
  const locationsWithNoContract = allLocations.filter(location => {
    const status = locationAgreementStatuses[location.id];
    return !status || status.status === 'none';
  });
  const noContractCount = locationsWithNoContract.length;

  // Find accounts needing attention (have red or yellow locations)
  const accountsNeedingAttention = accounts.filter(account => {
    const health = accountHealth[account.id];
    return health && (health.red > 0 || health.yellow > 0);
  });

  // Count agreements by urgency
  const expiringSoon = expiringAgreements.filter(a => a.daysUntilExpiry <= 30).length;
  const expiringLater = expiringAgreements.filter(a => a.daysUntilExpiry > 30 && a.daysUntilExpiry <= 90).length;

  // Calculate total locations with issues
  let totalLocationsWithIssues = 0;
  accountsNeedingAttention.forEach(account => {
    const health = accountHealth[account.id];
    if (health) {
      totalLocationsWithIssues += (health.red || 0) + (health.yellow || 0);
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-navy-900 mb-1">
          Contract Overview
        </h1>
        <p className="text-navy-600">
          Monitor corporate accounts and agreement health
        </p>
      </div>

      {/* Warning Banner for No Contracts */}
      {noContractCount > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">
                Warning: {noContractCount} Location{noContractCount !== 1 ? 's' : ''} Without Contract
              </h3>
              <p className="text-sm text-red-700">
                {noContractCount} location{noContractCount !== 1 ? 's' : ''} {noContractCount === 1 ? 'has' : 'have'} no active agreement. Please review and add contracts as needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics - Minimal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-navy-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-navy-600">Corporate Accounts</p>
            <Building2 className="w-5 h-5 text-navy-400" />
          </div>
          <p className="text-2xl font-heading font-bold text-navy-900">
            {totalAccounts}
          </p>
          <p className="text-xs text-navy-500 mt-1">
            {activeAccounts} active
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-navy-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-navy-600">All Locations</p>
            <MapPin className="w-5 h-5 text-navy-400" />
          </div>
          <p className="text-2xl font-heading font-bold text-navy-900">
            {totalLocations}
          </p>
          <p className="text-xs text-navy-500 mt-1">
            Total locations
          </p>
        </div>

        <div className={`rounded-lg shadow-sm border p-5 ${noContractCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-navy-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${noContractCount > 0 ? 'text-red-700' : 'text-navy-600'}`}>No Contract</p>
            <AlertTriangle className={`w-5 h-5 ${noContractCount > 0 ? 'text-red-600' : 'text-navy-400'}`} />
          </div>
          <p className={`text-2xl font-heading font-bold ${noContractCount > 0 ? 'text-red-700' : 'text-navy-900'}`}>
            {noContractCount}
          </p>
          <p className={`text-xs mt-1 ${noContractCount > 0 ? 'text-red-600' : 'text-navy-500'}`}>
            Location{noContractCount !== 1 ? 's' : ''} without contract
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-navy-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-navy-600">Needs Attention</p>
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-heading font-bold text-yellow-700">
            {accountsNeedingAttention.length}
          </p>
          <p className="text-xs text-navy-500 mt-1">
            {totalLocationsWithIssues} location{totalLocationsWithIssues !== 1 ? 's' : ''} with issues
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-navy-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-navy-600">Expiring Soon</p>
            <Calendar className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-heading font-bold text-orange-700">
            {expiringSoon}
          </p>
          <p className="text-xs text-navy-500 mt-1">
            Next 30 days
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-navy-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-navy-600">Upcoming Renewals</p>
            <Calendar className="w-5 h-5 text-navy-400" />
          </div>
          <p className="text-2xl font-heading font-bold text-navy-900">
            {expiringLater}
          </p>
          <p className="text-xs text-navy-500 mt-1">
            Next 31-90 days
          </p>
        </div>
      </div>

      {/* Accounts Needing Attention - Most Important */}
      {accountsNeedingAttention.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 mb-6">
          <div className="p-5 border-b border-navy-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h2 className="text-lg font-heading font-semibold text-navy-900">
                  Accounts Needing Attention
                </h2>
              </div>
              <Link
                href="/admin/accounts"
                className="text-sm text-gold-600 hover:text-gold-700 font-medium inline-flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-navy-100">
            {accountsNeedingAttention.slice(0, 5).map((account) => {
              const health = accountHealth[account.id];
              const redCount = health?.red || 0;
              const yellowCount = health?.yellow || 0;
              
              return (
                <Link
                  key={account.id}
                  href={`/admin/accounts/${account.id}?tab=agreements`}
                  className="block p-5 hover:bg-cream-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-navy-900">
                          {account.name}
                        </h3>
                        {account.code && (
                          <span className="text-xs font-mono text-navy-500 bg-navy-50 px-2 py-0.5 rounded">
                            {account.code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-navy-600">
                        {redCount > 0 && (
                          <span className="inline-flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="font-medium text-red-700">{redCount} expired</span>
                          </span>
                        )}
                        {yellowCount > 0 && (
                          <span className="inline-flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="font-medium text-yellow-700">{yellowCount} renewal due</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-navy-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Renewals */}
      {expiringAgreements.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-navy-100 mb-6">
          <div className="p-5 border-b border-navy-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-navy-600" />
                <h2 className="text-lg font-heading font-semibold text-navy-900">
                  Upcoming Renewals
                </h2>
              </div>
              <span className="text-sm text-navy-500">
                Next 90 days
              </span>
            </div>
          </div>
          <div className="divide-y divide-navy-100">
            {expiringAgreements.slice(0, 8).map((item) => {
              const isUrgent = item.daysUntilExpiry <= 30;
              
              return (
                <Link
                  key={item.agreement.id}
                  href={`/admin/agreements/${item.agreement.id}`}
                  className="block p-5 hover:bg-cream-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-navy-900">
                          {item.agreement.title}
                        </h3>
                        {isUrgent && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-navy-600">
                        <span>{item.account_name}</span>
                        {item.location_name && (
                          <>
                            <span className="text-navy-300">•</span>
                            <span>{item.location_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isUrgent ? 'text-orange-700' : 'text-navy-700'}`}>
                        {item.daysUntilExpiry} day{item.daysUntilExpiry !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-navy-500">
                        {new Date(item.agreement.end_date!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty States */}
      {accountsNeedingAttention.length === 0 && expiringAgreements.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-navy-100 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-navy-900 mb-2">
            All Clear
          </h3>
          <p className="text-navy-600 mb-6">
            No accounts need attention and no agreements are expiring soon.
          </p>
          <Link
            href="/admin/accounts"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            View All Accounts
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link
          href="/admin/accounts"
          className="btn btn-secondary"
        >
          View All Accounts
        </Link>
        <Link
          href="/admin/accounts/new"
          className="btn btn-primary"
        >
          New Account
        </Link>
      </div>
    </div>
  );
}
