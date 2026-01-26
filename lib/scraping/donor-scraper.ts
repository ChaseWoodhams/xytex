import puppeteer, { Browser, Page } from 'puppeteer';
import { parseDonorData, parseInventoryData, type ParsedDonorData } from './parsers';
// Note: This scraper uses admin client for all database operations
// to work in background contexts (cron jobs, async operations)
import type { MarketingDonor } from '../supabase/types';
import { createMarketingDonor, updateMarketingDonor, getMarketingDonorById } from '../supabase/marketing-donors';
import { createAdminClient } from '../supabase/admin';
import { getScrapingCredentials } from '../supabase/scraping';

export interface ScrapingOptions {
  delayBetweenRequests?: number; // milliseconds
  timeout?: number; // milliseconds
  headless?: boolean;
  retryAttempts?: number;
}

const DEFAULT_OPTIONS: ScrapingOptions = {
  delayBetweenRequests: 3000, // 3 seconds
  timeout: 60000, // 60 seconds
  headless: true,
  retryAttempts: 2,
};

export class DonorScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn: boolean = false;

  async initialize(options: ScrapingOptions = {}): Promise<void> {
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

  async loginToXytex(email: string, password: string): Promise<boolean> {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call initialize() first.');
    }

    try {
      console.log('[LOGIN] Starting Xytex login process...');
      console.log('[LOGIN] Navigating to https://www.xytex.com');
      // Navigate to homepage first
      await this.page.goto('https://www.xytex.com', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      console.log('[LOGIN] Homepage loaded');

      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to click "MY ACCOUNT" button to open login modal
      console.log('[LOGIN] Looking for "MY ACCOUNT" button...');
      try {
        // Try multiple selectors for the MY ACCOUNT button
        const accountButtonSelectors = [
          'a:has-text("MY ACCOUNT")',
          'button:has-text("MY ACCOUNT")',
          'a[href*="account"]',
          'a[href*="login"]',
          '*[class*="account"]',
          '*[class*="login"]',
        ];

        let accountButtonClicked = false;
        for (const selector of accountButtonSelectors) {
          try {
            // Use evaluate to find button by text content
            const buttonFound = await this.page.evaluate((text) => {
              const buttons = Array.from(document.querySelectorAll('a, button'));
              const btn = buttons.find((b: Element) => 
                b.textContent?.toUpperCase().includes(text.toUpperCase())
              );
              if (btn) {
                (btn as HTMLElement).click();
                return true;
              }
              return false;
            }, 'MY ACCOUNT');

            if (buttonFound) {
              console.log('[LOGIN] Clicked MY ACCOUNT button');
              accountButtonClicked = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }

        // If we couldn't find MY ACCOUNT button, try navigating directly to /login
        if (!accountButtonClicked) {
          console.log('[LOGIN] MY ACCOUNT button not found, navigating to /login...');
          await this.page.goto('https://www.xytex.com/login', {
            waitUntil: 'networkidle2',
            timeout: 30000,
          });
        }

        // Wait for modal/login form to appear
        console.log('[LOGIN] Waiting for login modal/form to appear...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        console.log('[LOGIN] Error clicking MY ACCOUNT, trying direct /login navigation...');
        await this.page.goto('https://www.xytex.com/login', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Wait for email field to be visible and enabled
      console.log('[LOGIN] Waiting for email field to be visible...');
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[id*="email" i]',
        'input[name*="email" i]',
        'input[placeholder*="email" i]',
        '#email',
      ];

      let emailSelector = null;
      for (const selector of emailSelectors) {
        try {
          await this.page.waitForSelector(selector, { 
            visible: true,
            timeout: 5000 
          });
          // Check if element is actually visible and enabled
          const isVisible = await this.page.evaluate((sel) => {
            const el = document.querySelector(sel) as HTMLElement;
            if (!el) return false;
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   !el.hasAttribute('disabled');
          }, selector);
          
          if (isVisible) {
            emailSelector = selector;
            console.log(`[LOGIN] Found visible email field with selector: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!emailSelector) {
        const pageContent = await this.page.content();
        console.error('[LOGIN] Could not find email field. Page title:', await this.page.title());
        console.error('[LOGIN] Page URL:', this.page.url());
        console.error('[LOGIN] First 1000 chars of page:', pageContent.substring(0, 1000));
        throw new Error('Could not find email input field on login page');
      }

      // Wait for password field
      console.log('[LOGIN] Waiting for password field to be visible...');
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[id*="password" i]',
        'input[name*="password" i]',
        '#password',
      ];

      let passwordSelector = null;
      for (const selector of passwordSelectors) {
        try {
          await this.page.waitForSelector(selector, { 
            visible: true,
            timeout: 5000 
          });
          const isVisible = await this.page.evaluate((sel) => {
            const el = document.querySelector(sel) as HTMLElement;
            if (!el) return false;
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   !el.hasAttribute('disabled');
          }, selector);
          
          if (isVisible) {
            passwordSelector = selector;
            console.log(`[LOGIN] Found visible password field with selector: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!passwordSelector) {
        console.error('[LOGIN] Could not find password field');
        throw new Error('Could not find password input field on login page');
      }

      // Use page.type() directly instead of clicking - it handles focus automatically
      console.log('[LOGIN] Filling in email field using page.type()...');
      // Clear field first by selecting all and deleting
      await this.page.focus(emailSelector);
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('a');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Delete');
      // Type email
      await this.page.type(emailSelector, email, { delay: 50 });
      console.log('[LOGIN] Email entered');
      
      console.log('[LOGIN] Filling in password field using page.type()...');
      // Clear password field
      await this.page.focus(passwordSelector);
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('a');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Delete');
      // Type password
      await this.page.type(passwordSelector, password, { delay: 50 });
      console.log('[LOGIN] Password entered');

      // Wait a moment before submitting
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('[LOGIN] Looking for submit button...');

      // Try to find and click submit button using page.click() which is more reliable
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
      ];

      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          // Check if element exists and is visible
          const exists = await this.page.$(selector);
          if (exists) {
            const isVisible = await this.page.evaluate((sel) => {
              const el = document.querySelector(sel) as HTMLElement;
              if (!el) return false;
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && style.visibility !== 'hidden';
            }, selector);
            
            if (isVisible) {
              console.log(`[LOGIN] Found visible submit button with selector: ${selector}`);
              await this.page.click(selector);
              submitted = true;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      // If no submit button found by selector, try finding by text content using evaluate
      if (!submitted) {
        try {
          console.log('[LOGIN] Trying to find submit button by text content...');
          const buttonClicked = await this.page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
            const submitBtn = buttons.find((btn: Element) => {
              const text = btn.textContent?.toLowerCase() || '';
              const value = (btn as HTMLInputElement).value?.toLowerCase() || '';
              return text.includes('sign in') || 
                     text.includes('login') || 
                     text.includes('log in') ||
                     text.includes('submit') ||
                     value.includes('sign in') ||
                     value.includes('login');
            });
            
            if (submitBtn) {
              (submitBtn as HTMLElement).click();
              return true;
            }
            return false;
          });

          if (buttonClicked) {
            console.log('[LOGIN] Found and clicked submit button by text content');
            submitted = true;
          }
        } catch (e) {
          console.log('[LOGIN] Could not find button by text:', e);
        }
      }

      if (!submitted) {
        // Try pressing Enter as fallback
        console.log('[LOGIN] Submit button not found, pressing Enter on password field as fallback...');
        await this.page.focus(passwordSelector);
        await this.page.keyboard.press('Enter');
        submitted = true; // Assume Enter will submit
      }

      // Wait for navigation or check for errors
      console.log('[LOGIN] Waiting for login to complete (navigation or timeout)...');
      await Promise.race([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
        new Promise(resolve => setTimeout(resolve, 5000)),
      ]).catch(() => {
        // Timeout is okay, we'll check the page state
      });

      // Wait a bit more for any async redirects
      console.log('[LOGIN] Waiting for async redirects...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if login was successful
      const currentUrl = this.page.url();
      const pageContent = await this.page.content();
      const pageText = await this.page.evaluate(() => document.body.innerText);
      const pageTitle = await this.page.title();
      
      console.log('[LOGIN] Current URL after login attempt:', currentUrl);
      console.log('[LOGIN] Page title:', pageTitle);
      
      // Check for SUCCESS indicators first (admin dashboard, account pages, etc.)
      const successUrlPatterns = [
        '/admin',
        '/dashboard',
        '/account',
        '/profile',
        'live.xytex.com', // Admin subdomain indicates successful login
      ];

      const successPageIndicators = [
        'administration dashboard',
        'admin dashboard',
        'main dashboard',
        'sign out',
        'log out',
        'logout',
      ];

      const isSuccessUrl = successUrlPatterns.some(pattern =>
        currentUrl.toLowerCase().includes(pattern.toLowerCase())
      );

      const isSuccessPage = successPageIndicators.some(indicator =>
        pageTitle.toLowerCase().includes(indicator.toLowerCase()) ||
        pageText.toLowerCase().includes(indicator.toLowerCase())
      );

      // If we're on an admin/success page, login was successful
      if (isSuccessUrl || isSuccessPage) {
        console.log('[LOGIN] Login successful!');
        console.log('[LOGIN] Success URL pattern matched:', isSuccessUrl);
        console.log('[LOGIN] Success page indicator matched:', isSuccessPage);
        console.log('[LOGIN] Final URL:', currentUrl);
        this.isLoggedIn = true;
        
        // Update last_used_at in credentials (using admin client)
        const credSupabase = createAdminClient();
        const { data: creds } = await (credSupabase
          .from('scraping_credentials')
          .select('*')
          .eq('is_active', true)
          .maybeSingle() as any);
        if (creds) {
          await (credSupabase
            .from('scraping_credentials') as any)
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', (creds as { id: string }).id);
        }

        return true;
      }

      // Check if we're still on login page (indicates failure)
      const stillOnLoginPage = currentUrl.includes('/login') || currentUrl.includes('xytex.com/login');
      
      // Check for specific error messages (not just the word "error" which can appear in valid pages)
      const specificErrorMessages = [
        'invalid email',
        'invalid password',
        'incorrect password',
        'incorrect email',
        'wrong password',
        'wrong email',
        'authentication failed',
        'login failed',
        'please sign in',
        'sign in to continue',
      ];

      const hasSpecificError = specificErrorMessages.some(message =>
        pageText.toLowerCase().includes(message.toLowerCase()) ||
        pageContent.toLowerCase().includes(message.toLowerCase())
      );

      // If still on login page or has specific error, login failed
      if (stillOnLoginPage || hasSpecificError) {
        console.error('[LOGIN] Login failed. URL:', currentUrl);
        console.error('[LOGIN] Still on login page:', stillOnLoginPage);
        console.error('[LOGIN] Has specific error message:', hasSpecificError);
        console.error('[LOGIN] Page text snippet:', pageText.substring(0, 500));
        this.isLoggedIn = false;
        return false;
      }

      // If we can't determine and we're not on login page, assume success (might be a different page)
      console.log('[LOGIN] Unable to definitively determine login status, but not on login page');
      console.log('[LOGIN] URL:', currentUrl);
      console.log('[LOGIN] Assuming login successful based on URL change');
      this.isLoggedIn = true;
      
      // Update last_used_at
      const credSupabase = createAdminClient();
      const { data: creds } = await (credSupabase
        .from('scraping_credentials')
        .select('*')
        .eq('is_active', true)
        .maybeSingle() as any);
      if (creds) {
        await (credSupabase
          .from('scraping_credentials') as any)
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', (creds as { id: string }).id);
      }

      return true;
    } catch (error: any) {
      console.error('[LOGIN] Error logging into Xytex:', error.message);
      console.error('[LOGIN] Error stack:', error.stack);
      this.isLoggedIn = false;
      return false;
    }
  }

  async scrapeDonorProfile(donorId: string, options: ScrapingOptions = {}): Promise<ParsedDonorData | null> {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call initialize() first.');
    }

    if (!this.isLoggedIn) {
      // Try to login with stored credentials
      const credentials = await getScrapingCredentials();
      if (!credentials) {
        throw new Error('No scraping credentials found. Please configure credentials first.');
      }

      console.log('Attempting to login with email:', credentials.xytex_email);
      const loggedIn = await this.loginToXytex(credentials.xytex_email, credentials.xytex_password);
      if (!loggedIn) {
        throw new Error('Failed to login to Xytex. Please check your credentials and try again. The login page structure may have changed.');
      }
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const url = `https://www.xytex.com/donor/${donorId}`;

    try {
      console.log(`[SCRAPE ${donorId}] Current URL before navigation: ${this.page.url()}`);
      console.log(`[SCRAPE ${donorId}] Navigating to ${url}`);
      
      // Navigate to donor profile
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: opts.timeout,
      });
      console.log(`[SCRAPE ${donorId}] Page loaded, current URL: ${this.page.url()}`);

      // Wait a bit for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if page loaded successfully
      const pageContent = await this.page.content();
      const pageTitle = await this.page.title();
      const currentUrl = this.page.url();
      
      console.log(`[SCRAPE ${donorId}] Page title: ${pageTitle}`);
      console.log(`[SCRAPE ${donorId}] Page content length: ${pageContent.length} characters`);
      console.log(`[SCRAPE ${donorId}] Full HTML retrieved (showing first 1000 chars for debugging): ${pageContent.substring(0, 1000)}`);
      
      // Check for actual error conditions - be very specific
      // Only fail if we're redirected to login page or see clear error messages
      const isLoginPage = currentUrl.includes('/login') || currentUrl.includes('xytex.com/login');
      const is404Page = currentUrl.includes('/404') || currentUrl.includes('not-found');
      
      // Check for specific error messages in page content (not just "Sign in" which appears in nav)
      const errorMessages = [
        'page not found',
        '404 error',
        'access denied',
        'please log in to continue',
        'you must be logged in',
        'authentication required',
      ];
      
      const hasErrorMessage = errorMessages.some(msg => 
        pageContent.toLowerCase().includes(msg.toLowerCase())
      );
      
      // Check if we're on the correct donor page URL
      const isCorrectUrl = currentUrl.includes(`/donor/${donorId}`) || currentUrl.includes(`donor/${donorId}`);
      
      if (isLoginPage || is404Page || (hasErrorMessage && !isCorrectUrl)) {
        console.error(`[SCRAPE ${donorId}] Page access issue detected:`);
        console.error(`[SCRAPE ${donorId}] - Is Login Page: ${isLoginPage}`);
        console.error(`[SCRAPE ${donorId}] - Is 404 Page: ${is404Page}`);
        console.error(`[SCRAPE ${donorId}] - Has Error Message: ${hasErrorMessage}`);
        console.error(`[SCRAPE ${donorId}] - Is Correct URL: ${isCorrectUrl}`);
        console.error(`[SCRAPE ${donorId}] - Final URL: ${currentUrl}`);
        return null;
      }
      
      // If we're not on the correct URL and not on an error page, log a warning but continue
      if (!isCorrectUrl && !isLoginPage && !is404Page) {
        console.warn(`[SCRAPE ${donorId}] Warning: Not on expected URL. Expected: /donor/${donorId}, Got: ${currentUrl}`);
        console.warn(`[SCRAPE ${donorId}] Continuing anyway to see if page is valid...`);
      }

      // Get the FULL HTML content (not truncated - this is the complete page)
      const html = await this.page.content();
      console.log(`[SCRAPE ${donorId}] Full HTML content retrieved: ${html.length} characters`);
      console.log(`[SCRAPE ${donorId}] (Log snippet shows first 1000 chars, but parsing uses full ${html.length} chars)`);

      // Parse the data using the FULL HTML
      console.log(`[SCRAPE ${donorId}] Parsing donor data from full HTML...`);
      const parsedData = parseDonorData(html, donorId);
      console.log(`[SCRAPE ${donorId}] Data parsed successfully from full HTML`);

      // Scrape inventory data from donor status report
      console.log(`[SCRAPE ${donorId}] Fetching inventory data from status report...`);
      try {
        const inventoryData = await this.scrapeInventoryData(donorId, opts);
        if (inventoryData) {
          parsedData.inventory_data = inventoryData;
          // Also create a summary string for inventory_summary field
          if (inventoryData.total_units !== undefined) {
            parsedData.inventory_summary = `Total Units: ${inventoryData.total_units}`;
            if (inventoryData.finished) {
              parsedData.inventory_summary += ` | Finished: ${inventoryData.finished.unwashed + inventoryData.finished.washed}`;
            }
            if (inventoryData.quarantine) {
              parsedData.inventory_summary += ` | Quarantine: ${inventoryData.quarantine.total || 0}`;
            }
          }
          console.log(`[SCRAPE ${donorId}] Inventory data retrieved successfully`);
        } else {
          console.warn(`[SCRAPE ${donorId}] Could not retrieve inventory data`);
        }
      } catch (error: any) {
        console.error(`[SCRAPE ${donorId}] Error fetching inventory data:`, error.message);
        // Don't fail the whole scrape if inventory fetch fails
      }

      // Add delay between requests
      if (opts.delayBetweenRequests) {
        await new Promise(resolve => setTimeout(resolve, opts.delayBetweenRequests));
      }

      return parsedData;
    } catch (error: any) {
      console.error(`Error scraping donor ${donorId}:`, error.message);
      return null;
    }
  }

  async runScrapingJob(
    donorIds: string[],
    jobId: string,
    userId: string,
    options: ScrapingOptions = {}
  ): Promise<void> {
    console.log(`[JOB ${jobId}] Starting scraping job for ${donorIds.length} donors`);
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Update job status to running using admin client
    console.log(`[JOB ${jobId}] Updating job status to 'running'`);
    const initSupabase = createAdminClient();
    await (initSupabase
      .from('scraping_jobs') as any)
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        total_donors: donorIds.length,
      })
      .eq('id', jobId);
    console.log(`[JOB ${jobId}] Job status updated`);

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    try {
      // Initialize browser
      await this.initialize(opts);

      // Login - get credentials using admin client
      const credSupabase = createAdminClient();
      const { data: credentials } = await (credSupabase
        .from('scraping_credentials')
        .select('*')
        .eq('is_active', true)
        .single() as any);
      
      if (!credentials) {
        throw new Error('No scraping credentials found');
      }

      const loggedIn = await this.loginToXytex(
        (credentials as { xytex_email: string; xytex_password: string }).xytex_email,
        (credentials as { xytex_email: string; xytex_password: string }).xytex_password
      );
      if (!loggedIn) {
        throw new Error('Failed to login to Xytex');
      }
      
      // Update last_used_at
        await (credSupabase
          .from('scraping_credentials') as any)
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', (credentials as { id: string }).id);

      // Create admin client once for the job
      const jobSupabase = createAdminClient();
      
      // Scrape each donor
      for (const donorId of donorIds) {
        try {
          processedCount++;
          console.log(`[JOB ${jobId}] Processing donor ${processedCount}/${donorIds.length}: ${donorId}`);
          
          // Get previous scrape data for change detection
          const { data: previousResult } = await (jobSupabase
            .from('scraping_results')
            .select('*')
            .eq('donor_id', donorId)
            .eq('scrape_status', 'success')
            .order('scraped_at', { ascending: false })
            .limit(1)
            .maybeSingle() as any);
          const previousData = (previousResult as any)?.scraped_data as ParsedDonorData | undefined;

          // Scrape the donor
          console.log(`[JOB ${jobId}] Scraping donor ${donorId}...`);
          const scrapedData = await this.scrapeDonorProfile(donorId, opts);

          if (!scrapedData) {
            // Failed to scrape
            console.error(`[JOB ${jobId}] Failed to scrape donor ${donorId}`);
            failedCount++;
            await (jobSupabase.from('scraping_results') as any).insert({
              job_id: jobId,
              donor_id: donorId,
              scrape_status: 'failed',
              error_message: 'Failed to scrape donor profile',
              scraped_by: userId,
            });
            await this.updateDonorIdListAfterScrape(jobSupabase, donorId, false);
            continue;
          }

          console.log(`[JOB ${jobId}] Successfully scraped donor ${donorId}`);
          // Detect changes
          const changes = this.detectChanges(previousData, scrapedData);
          if (Object.keys(changes).length > 0) {
            console.log(`[JOB ${jobId}] Changes detected for donor ${donorId}:`, Object.keys(changes));
          }

          // Save scraping result
          await (jobSupabase.from('scraping_results') as any).insert({
            job_id: jobId,
            donor_id: donorId,
            scrape_status: 'success',
            banner_message: scrapedData.banner_message || null,
            scraped_data: scrapedData as any,
            profile_current_date: scrapedData.profile_current_date
              ? new Date(scrapedData.profile_current_date).toISOString()
              : null,
            document_id: scrapedData.document_id || null,
            changes_detected: changes,
            scraped_by: userId,
          });

          // Update or create marketing donor
          await this.updateMarketingDonorFromScrapedData(donorId, scrapedData, userId);

          successCount++;
          await this.updateDonorIdListAfterScrape(jobSupabase, donorId, true);

          // Update job progress
          await (jobSupabase
            .from('scraping_jobs') as any)
            .update({
              processed_count: processedCount,
              success_count: successCount,
              failed_count: failedCount,
            })
            .eq('id', jobId);
          
          console.log(`[JOB ${jobId}] Progress: ${processedCount}/${donorIds.length} (${successCount} success, ${failedCount} failed)`);
        } catch (error: any) {
          console.error(`[JOB ${jobId}] Error processing donor ${donorId}:`, error.message);
          console.error(`[JOB ${jobId}] Error stack:`, error.stack);
          failedCount++;
          await (jobSupabase.from('scraping_results') as any).insert({
            job_id: jobId,
            donor_id: donorId,
            scrape_status: 'failed',
            error_message: error.message || 'Unknown error',
            scraped_by: userId,
          });
          await this.updateDonorIdListAfterScrape(jobSupabase, donorId, false);
          await (jobSupabase
            .from('scraping_jobs') as any)
            .update({
              processed_count: processedCount,
              failed_count: failedCount,
            })
            .eq('id', jobId);
        }
      }

      // Mark job as completed
      console.log(`[JOB ${jobId}] Job completed: ${successCount} success, ${failedCount} failed out of ${processedCount} processed`);
      await (jobSupabase
        .from('scraping_jobs') as any)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_count: processedCount,
          success_count: successCount,
          failed_count: failedCount,
        })
        .eq('id', jobId);
      console.log(`[JOB ${jobId}] Job marked as completed in database`);
    } catch (error: any) {
      console.error(`[JOB ${jobId}] Fatal error in scraping job:`, error.message);
      console.error(`[JOB ${jobId}] Error stack:`, error.stack);
      const errorSupabase = createAdminClient();
      await (errorSupabase
        .from('scraping_jobs') as any)
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
      console.error(`[JOB ${jobId}] Job marked as failed in database`);
    } finally {
      await this.cleanup();
    }
  }

  private detectChanges(
    oldData: ParsedDonorData | undefined,
    newData: ParsedDonorData
  ): Record<string, any> {
    if (!oldData) {
      return { initial_scrape: true };
    }

    const changes: Record<string, any> = {};

    // Compare key fields
    const fieldsToCompare: (keyof ParsedDonorData)[] = [
      'banner_message',
      'inventory_summary',
      'name',
      'occupation',
      'education',
      'vial_options',
      'compliance_flags',
      'document_id',
      'profile_current_date',
    ];

    fieldsToCompare.forEach((field) => {
      const oldValue = oldData[field];
      const newValue = newData[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[field] = {
          old: oldValue,
          new: newValue,
        };
      }
    });

    return changes;
  }

  private async updateDonorIdListAfterScrape(
    supabase: any,
    donorId: string,
    success: boolean
  ): Promise<void> {
    try {
      // Find the donor ID list item
      const { data: listItem } = await supabase
        .from('donor_id_list')
        .select('*')
        .eq('donor_id', donorId)
        .maybeSingle();

      if (!listItem) {
        return; // Donor ID not in list, skip update
      }

    const updates: any = {
      last_scraped_at: new Date().toISOString(),
    };

    if (success) {
      updates.last_successful_scrape_at = new Date().toISOString();
      updates.consecutive_failures = 0;
    } else {
      updates.consecutive_failures = (listItem.consecutive_failures || 0) + 1;
      // Auto-disable after 5 consecutive failures
      if (updates.consecutive_failures >= 5) {
        updates.is_active = false;
      }
    }

      await supabase
        .from('donor_id_list')
        .update(updates)
        .eq('id', listItem.id);
    } catch (error) {
      console.error(`Error updating donor ID list for ${donorId}:`, error);
      // Don't throw - non-critical
    }
  }

  private async updateMarketingDonorFromScrapedData(
    donorId: string,
    scrapedData: ParsedDonorData,
    userId: string
  ): Promise<void> {
    try {
      // Use admin client for database operations in background context
      const supabase = createAdminClient();
      
      // Check if marketing donor exists
      const { data: existing } = await supabase
        .from('marketing_donors')
        .select('*')
        .eq('id', donorId)
        .maybeSingle();

      const donorData: any = {
        id: donorId,
        name: scrapedData.name || null,
        year_of_birth: scrapedData.year_of_birth || null,
        marital_status: scrapedData.marital_status || null,
        number_of_children: scrapedData.number_of_children || null,
        occupation: scrapedData.occupation || null,
        education: scrapedData.education || null,
        blood_type: scrapedData.blood_type || null,
        nationality_maternal: scrapedData.nationality_maternal || null,
        nationality_paternal: scrapedData.nationality_paternal || null,
        race: scrapedData.race || null,
        cmv_status: scrapedData.cmv_status || null,
        height_feet_inches: scrapedData.height_feet_inches || null,
        height_cm: scrapedData.height_cm || null,
        weight_lbs: scrapedData.weight_lbs || null,
        weight_kg: scrapedData.weight_kg || null,
        eye_color: scrapedData.eye_color || null,
        hair_color: scrapedData.hair_color || null,
        hair_texture: scrapedData.hair_texture || null,
        hair_loss: scrapedData.hair_loss || null,
        hair_type: scrapedData.hair_type || null,
        body_build: scrapedData.body_build || null,
        freckles: scrapedData.freckles || null,
        skin_tone: scrapedData.skin_tone || null,
        genetic_tests_count: scrapedData.genetic_tests_count || null,
        genetic_test_results: scrapedData.genetic_test_results || null,
        last_medical_history_update: scrapedData.last_medical_history_update || null,
        health_info: scrapedData.health_info || null,
        health_comments: scrapedData.health_comments || null,
        skills_hobbies_interests: scrapedData.skills_hobbies_interests || null,
        personality_description: scrapedData.personality_description || null,
        education_details: scrapedData.education_details || null,
        immediate_family_history: scrapedData.immediate_family_history || null,
        paternal_family_history: scrapedData.paternal_family_history || null,
        maternal_family_history: scrapedData.maternal_family_history || null,
        health_diseases: scrapedData.health_diseases || null,
        vial_options: scrapedData.vial_options || null,
        audio_file_available: scrapedData.audio_file_available || null,
        photos_available: scrapedData.photos_available || null,
        inventory_summary: scrapedData.inventory_summary || scrapedData.banner_message || null,
        // Store inventory_data in compliance_flags JSONB field for now (we can add a dedicated field later if needed)
        compliance_flags: scrapedData.inventory_data 
          ? { ...(scrapedData.compliance_flags || {}), inventory_data: scrapedData.inventory_data }
          : scrapedData.compliance_flags || null,
        profile_current_date: scrapedData.profile_current_date
          ? new Date(scrapedData.profile_current_date).toISOString()
          : null,
        document_id: scrapedData.document_id || null,
        source_url: `https://www.xytex.com/donor/${donorId}`,
        created_by: userId,
      };

      if (existing) {
        // Update existing
        await (supabase
          .from('marketing_donors') as any)
          .update(donorData)
          .eq('id', donorId);
      } else {
        // Create new
        await (supabase
          .from('marketing_donors') as any)
          .insert(donorData);
      }
    } catch (error) {
      console.error(`Error updating marketing donor ${donorId}:`, error);
      // Don't throw - we still want to save the scraping result
    }
  }

  async scrapeInventoryData(donorId: string, options: ScrapingOptions = {}): Promise<Record<string, any> | null> {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call initialize() first.');
    }

    if (!this.isLoggedIn) {
      console.error(`[INVENTORY ${donorId}] Not logged in, cannot fetch inventory`);
      return null;
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const url = 'https://live.xytex.com/admin/donor_status_report/views/dashboard.cfm';

    try {
      console.log(`[INVENTORY ${donorId}] Navigating to inventory dashboard...`);
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: opts.timeout,
      });
      console.log(`[INVENTORY ${donorId}] Dashboard loaded`);

      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Find the donor ID input field using evaluate for more reliable detection
      console.log(`[INVENTORY ${donorId}] Looking for donor ID input field...`);
      const inputSelector = await this.page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
        for (const input of inputs) {
          const placeholder = (input as HTMLInputElement).placeholder?.toLowerCase() || '';
          const name = (input as HTMLInputElement).name?.toLowerCase() || '';
          const id = (input as HTMLInputElement).id?.toLowerCase() || '';
          const parentText = input.parentElement?.textContent?.toLowerCase() || '';
          
          if (placeholder.includes('donor') || 
              placeholder.includes('number') ||
              name.includes('donor') ||
              id.includes('donor') ||
              parentText.includes('donor number')) {
            // Return a unique identifier - we'll use the input's position or attributes
            return `input[placeholder*="${(input as HTMLInputElement).placeholder}"], input[name*="${(input as HTMLInputElement).name}"], input[id*="${(input as HTMLInputElement).id}"]`;
          }
        }
        return null;
      });

      let finalSelector = 'input[type="text"]';
      if (inputSelector) {
        // Try to use the found selector
        const parts = inputSelector.split(',');
        finalSelector = parts[0].trim();
      }

      // Wait for input to be visible
      try {
        await this.page.waitForSelector(finalSelector, { visible: true, timeout: 5000 });
      } catch (e) {
        console.warn(`[INVENTORY ${donorId}] Could not find input with selector ${finalSelector}, trying fallback...`);
        finalSelector = 'input[type="text"]';
        await this.page.waitForSelector(finalSelector, { visible: true, timeout: 3000 });
      }

      // Clear and type donor ID
      console.log(`[INVENTORY ${donorId}] Entering donor ID: ${donorId}`);
      await this.page.focus(finalSelector);
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('a');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Delete');
      await this.page.type(finalSelector, donorId, { delay: 50 });

      // Find and click "Get Status Report" button
      console.log(`[INVENTORY ${donorId}] Looking for "Get Status Report" button...`);
      const buttonFound = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
        const btn = buttons.find((b: Element) => {
          const text = b.textContent?.toLowerCase() || '';
          const value = (b as HTMLInputElement).value?.toLowerCase() || '';
          return text.includes('get status') || 
                 text.includes('status report') ||
                 value.includes('get status') ||
                 value.includes('status report');
        });
        if (btn) {
          (btn as HTMLElement).click();
          return true;
        }
        return false;
      });

      if (!buttonFound) {
        // Try pressing Enter as fallback
        console.log(`[INVENTORY ${donorId}] Button not found, pressing Enter...`);
        await this.page.keyboard.press('Enter');
      }

      // Wait for report to load
      console.log(`[INVENTORY ${donorId}] Waiting for report to load...`);
      await Promise.race([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
        new Promise(resolve => setTimeout(resolve, 5000)),
      ]);

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get the page content and parse inventory
      const html = await this.page.content();
      console.log(`[INVENTORY ${donorId}] Page HTML retrieved: ${html.length} characters`);
      console.log(`[INVENTORY ${donorId}] Current URL: ${this.page.url()}`);
      console.log(`[INVENTORY ${donorId}] Page title: ${await this.page.title()}`);
      
      // Save HTML to file for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        try {
          const fs = await import('fs');
          const path = await import('path');
          const debugDir = path.join(process.cwd(), '.debug');
          if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir, { recursive: true });
          }
          const htmlPath = path.join(debugDir, `donor-status-${donorId}-${Date.now()}.html`);
          fs.writeFileSync(htmlPath, html, 'utf-8');
          console.log(`[INVENTORY ${donorId}] Saved HTML to ${htmlPath} for debugging`);
        } catch (e) {
          // Ignore file system errors
        }
      }
      
      // Check if we're on the right page
      const pageText = await this.page.evaluate(() => document.body.innerText);
      const hasInventoryData = pageText.toLowerCase().includes('inventory data');
      console.log(`[INVENTORY ${donorId}] Page contains 'Inventory Data': ${hasInventoryData}`);
      
      if (!hasInventoryData) {
        console.warn(`[INVENTORY ${donorId}] Warning: Page may not have loaded inventory data. First 500 chars of page text: ${pageText.substring(0, 500)}`);
      }
      
      const inventoryData = parseInventoryData(html, donorId);
      
      if (inventoryData) {
        console.log(`[INVENTORY ${donorId}] Inventory parsed successfully: Total Units: ${inventoryData.total_units || 'N/A'}`);
        console.log(`[INVENTORY ${donorId}] Inventory data keys:`, Object.keys(inventoryData));
      } else {
        console.error(`[INVENTORY ${donorId}] Failed to parse inventory data`);
      }

      return inventoryData;
    } catch (error: any) {
      console.error(`[INVENTORY ${donorId}] Error scraping inventory:`, error.message);
      return null;
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
    this.isLoggedIn = false;
  }
}
