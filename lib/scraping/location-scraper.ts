import puppeteer, { Browser, Page } from 'puppeteer';
import { parseGoogleMapsResult, parseLinkedInResult, parseWebsiteContact, type ParsedLocationData } from './location-parsers';
import { createAdminClient } from '../supabase/admin';
import type { LocationScrapingResult } from '../supabase/types';

export interface LocationScrapingOptions {
  delayBetweenRequests?: number; // milliseconds
  timeout?: number; // milliseconds
  headless?: boolean;
  retryAttempts?: number;
}

const DEFAULT_OPTIONS: LocationScrapingOptions = {
  delayBetweenRequests: 3000, // 3 seconds
  timeout: 60000, // 60 seconds
  headless: true,
  retryAttempts: 2,
};

export class LocationScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(options: LocationScrapingOptions = {}): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    this.browser = await puppeteer.launch({
      headless: opts.headless !== false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  /**
   * Scrape Google Maps for business information
   */
  async scrapeGoogleMaps(query: string, options: LocationScrapingOptions = {}): Promise<ParsedLocationData | null> {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call initialize() first.');
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

    try {
      console.log(`[GOOGLE MAPS] Searching for: ${query}`);
      await this.page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: opts.timeout,
      });

      // Wait for results to load
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Try to click on first result if available
      try {
        // Look for the first result link
        const firstResultLink = await this.page.$('a[href*="/maps/place/"]');
        if (firstResultLink) {
          await firstResultLink.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          // Try alternative selectors
          const firstResult = await this.page.$('[class*="result"], [class*="place"], [data-value="Directions"]');
          if (firstResult) {
            await firstResult.click();
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      } catch (e) {
        console.log('[GOOGLE MAPS] Could not click first result, continuing with search page...');
      }

      // Wait a bit more for the details panel to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      const html = await this.page.content();
      const parsed = parseGoogleMapsResult(html, query);

      // If we found a website, automatically scrape it for more information
      if (parsed.website) {
        console.log(`[GOOGLE MAPS] Found website: ${parsed.website}, scraping for additional info...`);
        try {
          const websiteData = await this.scrapeWebsite(parsed.website, opts);
          if (websiteData) {
            // Merge website data with Google Maps data (website data takes precedence for contact info)
            parsed.email = websiteData.email || parsed.email;
            parsed.phone = websiteData.phone || parsed.phone;
            parsed.address_line1 = websiteData.address_line1 || parsed.address_line1;
            parsed.address_line2 = websiteData.address_line2 || parsed.address_line2;
            parsed.city = websiteData.city || parsed.city;
            parsed.state = websiteData.state || parsed.state;
            parsed.zip_code = websiteData.zip_code || parsed.zip_code;
            parsed.country = websiteData.country || parsed.country;
            parsed.employees = websiteData.employees.length > 0 ? websiteData.employees : parsed.employees;
            parsed.business_hours = websiteData.business_hours || parsed.business_hours;
            parsed.linkedin_url = websiteData.linkedin_url || parsed.linkedin_url;
            parsed.categories = [...new Set([...parsed.categories, ...websiteData.categories])];
            
            // Update business name if website has a better one
            if (websiteData.business_name && !parsed.business_name) {
              parsed.business_name = websiteData.business_name;
            }
            
            console.log(`[GOOGLE MAPS] Merged website data: ${websiteData.employees.length} employees, email: ${websiteData.email ? 'found' : 'not found'}`);
          }
        } catch (websiteError: any) {
          console.error(`[GOOGLE MAPS] Error scraping website ${parsed.website}:`, websiteError.message);
          // Continue with just Google Maps data
        }
      }

      // Add delay between requests
      if (opts.delayBetweenRequests) {
        await new Promise(resolve => setTimeout(resolve, opts.delayBetweenRequests));
      }

      return parsed;
    } catch (error: any) {
      console.error(`[GOOGLE MAPS] Error scraping ${query}:`, error.message);
      return null;
    }
  }

  /**
   * Scrape LinkedIn for company information
   */
  async scrapeLinkedIn(companyName: string, location?: string, options: LocationScrapingOptions = {}): Promise<ParsedLocationData | null> {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call initialize() first.');
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const searchQuery = location ? `${companyName} ${location}` : companyName;
    const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(searchQuery)}`;

    try {
      console.log(`[LINKEDIN] Searching for: ${searchQuery}`);
      await this.page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: opts.timeout,
      });

      // Wait for results
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Try to click first company result
      try {
        const firstResult = await this.page.$('a[href*="/company/"]');
        if (firstResult) {
          await firstResult.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (e) {
        console.log('[LINKEDIN] Could not click first result, continuing...');
      }

      const html = await this.page.content();
      const parsed = parseLinkedInResult(html, companyName);

      // Extract LinkedIn URL from current page
      if (this.page.url().includes('/company/')) {
        parsed.linkedin_url = this.page.url();
      }

      if (opts.delayBetweenRequests) {
        await new Promise(resolve => setTimeout(resolve, opts.delayBetweenRequests));
      }

      return parsed;
    } catch (error: any) {
      console.error(`[LINKEDIN] Error scraping ${companyName}:`, error.message);
      return null;
    }
  }

  /**
   * Scrape website for contact information
   */
  async scrapeWebsite(url: string, options: LocationScrapingOptions = {}): Promise<ParsedLocationData | null> {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call initialize() first.');
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      console.log(`[WEBSITE] Scraping: ${fullUrl}`);
      await this.page.goto(fullUrl, {
        waitUntil: 'networkidle2',
        timeout: opts.timeout,
      });

      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to navigate to contact/about pages
      try {
        // Look for contact or about links
        const contactLinks = await this.page.$$('a[href*="contact" i], a[href*="about" i], a[href*="team" i]');
        if (contactLinks.length > 0) {
          // Try the first contact/about link
          await contactLinks[0].click();
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (e) {
        // Continue with main page
        console.log('[WEBSITE] Could not navigate to contact page, using main page');
      }

      const html = await this.page.content();
      const parsed = parseWebsiteContact(html, fullUrl);

      if (opts.delayBetweenRequests) {
        await new Promise(resolve => setTimeout(resolve, opts.delayBetweenRequests));
      }

      return parsed;
    } catch (error: any) {
      console.error(`[WEBSITE] Error scraping ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Run a complete scraping job for multiple sources
   */
  async runScrapingJob(
    jobId: string,
    query: string,
    sources: string[],
    userId: string,
    options: LocationScrapingOptions = {},
    targetLocationId?: string
  ): Promise<void> {
    console.log(`[JOB ${jobId}] Starting location scraping job for: ${query}`);
    if (targetLocationId) {
      console.log(`[JOB ${jobId}] Target location ID: ${targetLocationId} - results will be auto-matched`);
    }
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Update job status to running
    const supabase = createAdminClient();
    await (supabase
      .from('location_scraping_jobs') as any)
      .update({
        status: 'running',
        results_count: 0,
      })
      .eq('id', jobId);

    let resultsCount = 0;
    let successCount = 0;
    let failedCount = 0;

    try {
      // Initialize browser
      await this.initialize(opts);

      // Scrape each source
      for (const source of sources) {
        try {
          let parsedData: ParsedLocationData | null = null;

          if (source === 'google_maps' || source === 'all') {
            parsedData = await this.scrapeGoogleMaps(query, opts);
          } else if (source === 'linkedin' || source === 'all') {
            parsedData = await this.scrapeLinkedIn(query, undefined, opts);
          } else if (source === 'website' || source === 'all') {
            // For website scraping, we might need the URL from Google Maps first
            // For now, try to extract from query if it looks like a URL
            if (query.includes('http') || query.includes('.com') || query.includes('.org')) {
              parsedData = await this.scrapeWebsite(query, opts);
            }
          }

          if (parsedData) {
            // Save result to database
            const resultData: Partial<LocationScrapingResult> = {
              job_id: jobId,
              source: source as any,
              business_name: parsedData.business_name,
              google_place_id: parsedData.google_place_id,
              address_line1: parsedData.address_line1,
              address_line2: parsedData.address_line2,
              city: parsedData.city,
              state: parsedData.state,
              zip_code: parsedData.zip_code,
              country: parsedData.country,
              phone: parsedData.phone,
              email: parsedData.email,
              website: parsedData.website,
              employees: parsedData.employees,
              business_hours: parsedData.business_hours,
              rating: parsedData.rating,
              review_count: parsedData.review_count,
              categories: parsedData.categories,
              linkedin_url: parsedData.linkedin_url,
              scraped_data: parsedData.raw_data,
              // Auto-match to target location if provided
              matched_location_id: targetLocationId || null,
            };

            await (supabase.from('location_scraping_results') as any).insert(resultData);
            resultsCount++;
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error: any) {
          console.error(`[JOB ${jobId}] Error scraping source ${source}:`, error.message);
          failedCount++;
        }
      }

      // Update job status
      await (supabase
        .from('location_scraping_jobs') as any)
        .update({
          status: 'completed',
          results_count: resultsCount,
        })
        .eq('id', jobId);

      console.log(`[JOB ${jobId}] Completed: ${successCount} success, ${failedCount} failed`);
    } catch (error: any) {
      console.error(`[JOB ${jobId}] Fatal error:`, error.message);
      await (supabase
        .from('location_scraping_jobs') as any)
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error',
        })
        .eq('id', jobId);
    } finally {
      await this.cleanup();
    }
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
