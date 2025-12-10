import { getAccounts } from "@/lib/supabase/accounts";
import { getLocationsByAccount } from "@/lib/supabase/locations";
import type { Account, Location } from "@/lib/supabase/types";
import Link from "next/link";
import { Building2, Plus, Search } from "lucide-react";
import AccountsList from "@/components/admin/AccountsList";
import InviteTeamMember from "@/components/admin/InviteTeamMember";

export default async function AccountsPage() {
  let accounts: Account[] = [];
  try {
    accounts = await getAccounts();
    console.log(`[AccountsPage] Loaded ${accounts.length} accounts`);
  } catch (error) {
    console.error('[AccountsPage] Error loading accounts:', error);
    accounts = [];
  }

  // Get location counts and city/state data for each account
  const accountsWithLocationCounts = await Promise.all(
    accounts.map(async (account) => {
      let locations: Location[] = [];
      try {
        locations = await getLocationsByAccount(account.id);
      } catch (error) {
        console.error(`Error fetching locations for account ${account.id}:`, error);
        // Continue with empty locations array if fetch fails
        locations = [];
      }
      const locationCount = locations.length;
      
      // Determine if this is a multi-location account based on account_type or location count
      const isMultiLocation = account.account_type === 'multi_location' || locationCount > 1;
      
      // For multi-location accounts, collect all unique city/state combinations
      let cities: string[] = [];
      let states: string[] = [];
      const countries = new Set<string>();
      const addresses: string[] = [];
      const zipCodes: string[] = [];
      
      // Collect countries from all locations (for both single and multi-location accounts)
      locations.forEach((location) => {
        if (location.country && location.country.trim()) {
          countries.add(location.country.trim());
        }
      });
      
      // For single-location accounts, also check account's country code
      // Always check account's country code as a fallback
      if (account.udf_country_code && account.udf_country_code.trim()) {
        countries.add(account.udf_country_code.trim());
      }
      
      if (isMultiLocation && locationCount > 1) {
        // Get unique cities, states, addresses, and zip codes from locations
        const citySet = new Set<string>();
        const stateSet = new Set<string>();
        const addressSet = new Set<string>();
        const zipSet = new Set<string>();
        
        locations.forEach((location) => {
          if (location.city) citySet.add(location.city);
          if (location.state) stateSet.add(location.state);
          if (location.address_line1) addressSet.add(location.address_line1);
          if (location.zip_code) zipSet.add(location.zip_code);
        });
        
        cities = Array.from(citySet);
        states = Array.from(stateSet);
        addresses.push(...Array.from(addressSet));
        zipCodes.push(...Array.from(zipSet));
      }
      
      return {
        ...account,
        locationCount,
        locationCities: cities,
        locationStates: states,
        locationCountries: Array.from(countries),
        locationAddresses: addresses,
        locationZipCodes: zipCodes,
      };
    })
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold text-navy-900 mb-2">
            Accounts
          </h1>
          <p className="text-navy-600">
            Manage your accounts and locations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <InviteTeamMember />
          <Link href="/admin/accounts/new" className="btn btn-primary">
            <Plus className="w-5 h-5" />
            New Account
          </Link>
        </div>
      </div>

      <AccountsList initialAccounts={accountsWithLocationCounts} />
    </div>
  );
}

