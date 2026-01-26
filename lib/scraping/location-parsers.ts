import * as cheerio from 'cheerio';

export interface ParsedLocationData {
  business_name: string | null;
  google_place_id: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  employees: Array<{
    name: string;
    title: string | null;
    email: string | null;
    phone: string | null;
  }>;
  business_hours: Record<string, any> | null;
  rating: number | null;
  review_count: number | null;
  categories: string[];
  linkedin_url: string | null;
  raw_data: Record<string, any>;
}

/**
 * Parse Google Maps search result HTML
 */
export function parseGoogleMapsResult(html: string, query: string): ParsedLocationData {
  const $ = cheerio.load(html);
  const result: ParsedLocationData = {
    business_name: null,
    google_place_id: null,
    address_line1: null,
    address_line2: null,
    city: null,
    state: null,
    zip_code: null,
    country: null,
    phone: null,
    email: null,
    website: null,
    employees: [],
    business_hours: null,
    rating: null,
    review_count: null,
    categories: [],
    linkedin_url: null,
    raw_data: {},
  };

  try {
    // Extract business name - try multiple selectors
    const nameSelectors = [
      'h1[data-attrid="title"]',
      'h1[class*="title"]',
      'h1',
      '[data-value="Directions"]',
      '[data-value="Save"]',
      '.x3AX1-LfntMc-header-title-title',
      '[class*="x3AX1-LfntMc-header-title-title"]',
      '[data-value*="title"]',
    ];
    
    for (const selector of nameSelectors) {
      const nameEl = $(selector).first();
      if (nameEl.length) {
        const nameText = nameEl.text().trim();
        if (nameText && nameText.length > 0 && !nameText.includes('Directions')) {
          result.business_name = nameText;
          break;
        }
      }
    }

    // Extract Google Place ID from data attributes or URL
    const placeIdMatch = html.match(/data-place-id="([^"]+)"/) || 
                        html.match(/place_id=([^&]+)/) ||
                        html.match(/!1s([^!]+)/) ||
                        html.match(/place\/([^\/]+)/);
    if (placeIdMatch) {
      result.google_place_id = placeIdMatch[1];
    }

    // Extract address - try multiple approaches
    const addressSelectors = [
      '[data-item-id="address"]',
      '[data-value="Directions"]',
      '.Io6YTe',
      '.rogA2c',
      '[class*="Io6YTe"]',
      '[class*="address"]',
      'button[data-value="Directions"]',
    ];
    
    for (const selector of addressSelectors) {
      const addressEl = $(selector).first();
      if (addressEl.length) {
        // Try to get text from the element or its parent
        let addressText = addressEl.text().trim();
        if (!addressText || addressText === 'Directions') {
          addressText = addressEl.closest('div').text().trim();
        }
        if (addressText && addressText.length > 5 && addressText !== 'Directions') {
          const parsed = parseAddress(addressText);
          if (parsed.address_line1) {
            result.address_line1 = parsed.address_line1;
            result.address_line2 = parsed.address_line2;
            result.city = parsed.city;
            result.state = parsed.state;
            result.zip_code = parsed.zip_code;
            result.country = parsed.country || 'USA';
            break;
          }
        }
      }
    }

    // Extract phone - try multiple selectors
    const phoneSelectors = [
      '[data-item-id^="phone"]',
      '[data-item-id*="phone"]',
      'a[href^="tel:"]',
      '[data-value*="phone"]',
      '[aria-label*="phone" i]',
    ];
    
    for (const selector of phoneSelectors) {
      const phoneEl = $(selector).first();
      if (phoneEl.length) {
        let phoneText = phoneEl.text().trim();
        if (!phoneText) {
          phoneText = phoneEl.attr('href')?.replace('tel:', '').trim() || '';
        }
        if (phoneText) {
          // Clean phone number
          const cleaned = phoneText.replace(/\D/g, '');
          if (cleaned.length >= 10) {
            result.phone = phoneText;
            break;
          }
        }
      }
    }

    // Extract website - try multiple selectors
    const websiteSelectors = [
      '[data-item-id="authority"]',
      'a[href^="http"]:not([href*="google"]):not([href*="maps"]):not([href*="search"])',
      '[data-value*="website"]',
      '[aria-label*="website" i]',
      'a[data-value*="http"]',
    ];
    
    for (const selector of websiteSelectors) {
      const websiteEl = $(selector).first();
      if (websiteEl.length) {
        let href = websiteEl.attr('href') || websiteEl.text().trim();
        // Skip Google/Maps URLs
        if (href && !href.includes('google') && !href.includes('maps') && !href.includes('search')) {
          // Handle Google Maps redirect URLs
          if (href.includes('url?q=')) {
            const urlMatch = href.match(/url\?q=([^&]+)/);
            if (urlMatch) {
              href = decodeURIComponent(urlMatch[1]);
            }
          }
          if (href.startsWith('http')) {
            result.website = href;
            break;
          } else if (href.includes('.') && !href.includes(' ')) {
            result.website = `https://${href}`;
            break;
          }
        }
      }
    }

    // Extract rating and review count - try multiple patterns
    const ratingPatterns = [
      /(\d+\.?\d*)\s*(?:stars?|rating|★|⭐)/i,
      /rating[^>]*>([\d.]+)/i,
      /([\d.]+)\s*out of/i,
      /([\d.]+)\s*\/\s*5/i,
    ];
    
    for (const pattern of ratingPatterns) {
      const match = html.match(pattern);
      if (match) {
        const rating = parseFloat(match[1]);
        if (rating >= 1 && rating <= 5) {
          result.rating = rating;
          break;
        }
      }
    }

    // Extract review count
    const reviewPatterns = [
      /(\d+)\s*(?:reviews?|ratings?)/i,
      /(\d+)\s*Google reviews/i,
      /(\d+)\s*review/i,
    ];
    
    for (const pattern of reviewPatterns) {
      const match = html.match(pattern);
      if (match) {
        const count = parseInt(match[1], 10);
        if (count > 0) {
          result.review_count = count;
          break;
        }
      }
    }

    // Extract business hours
    const hoursSelectors = [
      '[data-item-id*="hours"]',
      '[class*="hours"]',
      '[class*="opening"]',
      '[aria-label*="hours" i]',
    ];
    
    const businessHours: Record<string, string> = {};
    for (const selector of hoursSelectors) {
      const hoursEl = $(selector).first();
      if (hoursEl.length) {
        const hoursText = hoursEl.text().trim();
        if (hoursText && hoursText.length > 5) {
          // Try to parse hours (basic parsing)
          const dayMatches = hoursText.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[^:]*:\s*([^\n]+)/gi);
          if (dayMatches) {
            dayMatches.forEach(match => {
              const parts = match.split(':');
              if (parts.length >= 2) {
                const day = parts[0].trim();
                const hours = parts.slice(1).join(':').trim();
                businessHours[day] = hours;
              }
            });
          } else {
            // Store raw hours text
            businessHours['raw'] = hoursText;
          }
          if (Object.keys(businessHours).length > 0) {
            result.business_hours = businessHours;
            break;
          }
        }
      }
    }

    // Extract categories
    const categorySelectors = [
      '[class*="category"]',
      '[data-value*="category"]',
      '[aria-label*="category" i]',
      'button[data-value*="category"]',
    ];
    
    for (const selector of categorySelectors) {
      const categoryEls = $(selector);
      categoryEls.each((_, el) => {
        const category = $(el).text().trim();
        if (category && category.length > 2 && !result.categories.includes(category)) {
          result.categories.push(category);
        }
      });
      if (result.categories.length > 0) break;
    }

    // Store raw HTML for debugging (limited size)
    result.raw_data = { 
      html: html.substring(0, 50000), // Increased size for better debugging
      url: query 
    };
  } catch (error: any) {
    console.error('Error parsing Google Maps result:', error);
    result.raw_data = { error: error.message, html: html.substring(0, 1000) };
  }

  return result;
}

/**
 * Parse LinkedIn company page HTML
 */
export function parseLinkedInResult(html: string, companyName: string): ParsedLocationData {
  const $ = cheerio.load(html);
  const result: ParsedLocationData = {
    business_name: companyName,
    google_place_id: null,
    address_line1: null,
    address_line2: null,
    city: null,
    state: null,
    zip_code: null,
    country: null,
    phone: null,
    email: null,
    website: null,
    employees: [],
    business_hours: null,
    rating: null,
    review_count: null,
    categories: [],
    linkedin_url: null,
    raw_data: {},
  };

  try {
    // Extract LinkedIn URL
    const linkedinUrlMatch = html.match(/https?:\/\/[^"'\s]*linkedin\.com\/company\/[^"'\s]+/);
    if (linkedinUrlMatch) {
      result.linkedin_url = linkedinUrlMatch[0];
    }

    // Extract website
    const websiteEl = $('a[href^="http"]:not([href*="linkedin"])').first();
    const websiteHref = websiteEl.attr('href');
    if (websiteHref) {
      result.website = websiteHref;
    }

    // Extract address (if available on LinkedIn)
    const addressText = $('[class*="address"], [class*="location"]').first().text().trim();
    if (addressText) {
      const parsed = parseAddress(addressText);
      result.address_line1 = parsed.address_line1;
      result.city = parsed.city;
      result.state = parsed.state;
      result.zip_code = parsed.zip_code;
      result.country = parsed.country;
    }

    // Extract employees from "People" section
    $('[class*="people"], [class*="employee"]').each((_, el) => {
      const nameEl = $(el).find('[class*="name"]').first();
      const titleEl = $(el).find('[class*="title"], [class*="position"]').first();
      
      if (nameEl.length) {
        result.employees.push({
          name: nameEl.text().trim(),
          title: titleEl.length ? titleEl.text().trim() : null,
          email: null,
          phone: null,
        });
      }
    });

    // Extract industry/categories
    const industryEl = $('[class*="industry"]').first();
    if (industryEl.length) {
      result.categories.push(industryEl.text().trim());
    }

    result.raw_data = { html: html.substring(0, 10000) };
  } catch (error: any) {
    console.error('Error parsing LinkedIn result:', error);
    result.raw_data = { error: error.message, html: html.substring(0, 1000) };
  }

  return result;
}

/**
 * Parse website HTML for contact information
 */
export function parseWebsiteContact(html: string, url: string): ParsedLocationData {
  const $ = cheerio.load(html);
  const result: ParsedLocationData = {
    business_name: null,
    google_place_id: null,
    address_line1: null,
    address_line2: null,
    city: null,
    state: null,
    zip_code: null,
    country: null,
    phone: null,
    email: null,
    website: url,
    employees: [],
    business_hours: null,
    rating: null,
    review_count: null,
    categories: [],
    linkedin_url: null,
    raw_data: {},
  };

  try {
    // Extract business name from title, h1, or meta tags
    result.business_name = $('title').text().trim().split('|')[0].split('-')[0].trim() || 
                          $('h1').first().text().trim() || 
                          $('meta[property="og:site_name"]').attr('content') ||
                          $('meta[property="og:title"]').attr('content') ||
                          null;

    // Extract email addresses - look in multiple places
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatches = html.match(emailRegex);
    if (emailMatches && emailMatches.length > 0) {
      // Filter out common non-contact emails and prioritize contact/info emails
      const contactEmails = emailMatches
        .filter(email => {
          const lower = email.toLowerCase();
          return !lower.includes('noreply') && 
                 !lower.includes('no-reply') &&
                 !lower.includes('donotreply') &&
                 !lower.includes('privacy') &&
                 !lower.includes('unsubscribe');
        })
        .sort((a, b) => {
          // Prioritize emails with "contact", "info", "hello" in the name
          const aLower = a.toLowerCase();
          const bLower = b.toLowerCase();
          if (aLower.includes('contact') || aLower.includes('info')) return -1;
          if (bLower.includes('contact') || bLower.includes('info')) return 1;
          return 0;
        });
      
      if (contactEmails.length > 0) {
        result.email = contactEmails[0];
      }
    }

    // Extract phone numbers - try multiple formats (US, UK, international)
    const phonePatterns = [
      /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // US format
      /(\+44\s?)?(0?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4})/g, // UK format
      /(\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, // International
    ];
    
    const phoneMatches: string[] = [];
    for (const pattern of phonePatterns) {
      const matches = html.match(pattern);
      if (matches) {
        phoneMatches.push(...matches);
      }
    }
    
    if (phoneMatches.length > 0) {
      // Clean and validate phone numbers
      const validPhones = phoneMatches
        .map(phone => phone.replace(/\s+/g, ' ').trim())
        .filter(phone => {
          const digits = phone.replace(/\D/g, '');
          return digits.length >= 10; // At least 10 digits
        });
      
      if (validPhones.length > 0) {
        result.phone = validPhones[0];
      }
    }

    // Extract address - try multiple selectors and patterns
    const addressSelectors = [
      '[class*="address"]',
      '[class*="contact"]',
      '[itemprop="address"]',
      '[class*="location"]',
      '[class*="office"]',
      'address',
      '[data-address]',
    ];

    for (const selector of addressSelectors) {
      const addressEls = $(selector);
      for (let i = 0; i < addressEls.length; i++) {
        const addressEl = $(addressEls[i]);
        const addressText = addressEl.text().trim();
        if (addressText && addressText.length > 10) {
          const parsed = parseAddress(addressText);
          if (parsed.address_line1) {
            result.address_line1 = parsed.address_line1;
            result.address_line2 = parsed.address_line2;
            result.city = parsed.city;
            result.state = parsed.state;
            result.zip_code = parsed.zip_code;
            result.country = parsed.country || 'USA';
            break;
          }
        }
      }
      if (result.address_line1) break;
    }

    // Extract LinkedIn URL
    const linkedinMatch = html.match(/https?:\/\/[^"'\s]*linkedin\.com\/company\/[^"'\s]+/);
    if (linkedinMatch) {
      result.linkedin_url = linkedinMatch[0];
    }

    // Extract employees from "Team", "Staff", "About", "Meet the Team" sections
    const teamSelectors = [
      '[class*="team"]',
      '[class*="staff"]',
      '[class*="employee"]',
      '[class*="people"]',
      '[id*="team"]',
      '[id*="staff"]',
      'section[class*="team"]',
    ];

    for (const selector of teamSelectors) {
      const teamSection = $(selector).first();
      if (teamSection.length) {
        teamSection.find('[class*="member"], [class*="person"], [class*="staff"]').each((_, el) => {
          const memberEl = $(el);
          const nameEl = memberEl.find('[class*="name"], h3, h4, h5').first();
          const titleEl = memberEl.find('[class*="title"], [class*="position"], [class*="role"]').first();
          
          if (nameEl.length) {
            const name = nameEl.text().trim();
            const title = titleEl.length ? titleEl.text().trim() : null;
            
            // Try to extract email from this member's section
            const memberHtml = memberEl.html() || '';
            const emailMatch = memberHtml.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            const email = emailMatch ? emailMatch[0] : null;
            
            // Try to extract phone
            const phoneMatch = memberHtml.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
            const phone = phoneMatch ? phoneMatch[0] : null;
            
            if (name && name.length > 2) {
              result.employees.push({
                name,
                title,
                email,
                phone,
              });
            }
          }
        });
        
        if (result.employees.length > 0) break;
      }
    }

    // Extract business hours if available
    const hoursSelectors = [
      '[class*="hours"]',
      '[class*="opening"]',
      '[class*="schedule"]',
      '[id*="hours"]',
    ];
    
    const businessHours: Record<string, string> = {};
    for (const selector of hoursSelectors) {
      const hoursEl = $(selector).first();
      if (hoursEl.length) {
        const hoursText = hoursEl.text().trim();
        if (hoursText && hoursText.length > 5) {
          const dayMatches = hoursText.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[^:]*:\s*([^\n]+)/gi);
          if (dayMatches) {
            dayMatches.forEach(match => {
              const parts = match.split(':');
              if (parts.length >= 2) {
                const day = parts[0].trim();
                const hours = parts.slice(1).join(':').trim();
                businessHours[day] = hours;
              }
            });
          } else {
            businessHours['raw'] = hoursText;
          }
          if (Object.keys(businessHours).length > 0) {
            result.business_hours = businessHours;
            break;
          }
        }
      }
    }

    // Extract categories/industry from meta tags or content
    const categorySources = [
      $('meta[property="og:type"]').attr('content'),
      $('[class*="category"]').first().text().trim(),
      $('[class*="industry"]').first().text().trim(),
    ];
    
    categorySources.forEach(cat => {
      if (cat && cat.length > 2 && !result.categories.includes(cat)) {
        result.categories.push(cat);
      }
    });

    result.raw_data = { html: html.substring(0, 50000), url };
  } catch (error: any) {
    console.error('Error parsing website contact:', error);
    result.raw_data = { error: error.message, html: html.substring(0, 1000), url };
  }

  return result;
}

/**
 * Helper function to parse address string into components
 */
function parseAddress(addressText: string): {
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
} {
  const result = {
    address_line1: null as string | null,
    address_line2: null as string | null,
    city: null as string | null,
    state: null as string | null,
    zip_code: null as string | null,
    country: null as string | null,
  };

  // UK address pattern: "Street, City, Postcode" or "Street, City County"
  const ukAddressMatch = addressText.match(/^(.+?),\s*(.+?)(?:,\s*([A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}|\d{5,7}))?$/i);
  if (ukAddressMatch) {
    result.address_line1 = ukAddressMatch[1].trim();
    const cityPart = ukAddressMatch[2].trim();
    // Check if city part contains a county/state
    const cityStateMatch = cityPart.match(/^(.+?)(?:\s+([A-Z]{2,}))?$/i);
    if (cityStateMatch) {
      result.city = cityStateMatch[1].trim();
      if (cityStateMatch[2]) {
        result.state = cityStateMatch[2].trim();
      }
    } else {
      result.city = cityPart;
    }
    if (ukAddressMatch[3]) {
      result.zip_code = ukAddressMatch[3].trim();
    }
    result.country = 'UK';
    return result;
  }

  // Common US address patterns
  // Format: "123 Main St, City, ST 12345" or "123 Main St, City, ST 12345, USA"
  const usAddressMatch = addressText.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)(?:,\s*(.+))?$/i);
  if (usAddressMatch) {
    result.address_line1 = usAddressMatch[1].trim();
    result.city = usAddressMatch[2].trim();
    result.state = usAddressMatch[3].trim().toUpperCase();
    result.zip_code = usAddressMatch[4].trim();
    result.country = usAddressMatch[5]?.trim() || 'USA';
    return result;
  }

  // Simpler US pattern: "123 Main St, City, ST"
  const simpleMatch = addressText.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})$/i);
  if (simpleMatch) {
    result.address_line1 = simpleMatch[1].trim();
    result.city = simpleMatch[2].trim();
    result.state = simpleMatch[3].trim().toUpperCase();
    result.country = 'USA';
    return result;
  }

  // If no pattern matches, try to extract components manually
  const parts = addressText.split(',').map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length >= 2) {
    result.address_line1 = parts[0];
    result.city = parts[1];
    
    if (parts.length >= 3) {
      // Check if third part is state+zip or just state
      const stateZip = parts[2].match(/([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?/i);
      if (stateZip) {
        result.state = stateZip[1].toUpperCase();
        result.zip_code = stateZip[2] || null;
      } else {
        // Might be UK postcode or other format
        const ukPostcode = parts[2].match(/([A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}|\d{5,7})/i);
        if (ukPostcode) {
          result.zip_code = ukPostcode[1];
          result.country = 'UK';
        } else {
          result.state = parts[2];
        }
      }
    }
    
    // Last part might be country
    if (parts.length >= 4) {
      result.country = parts[parts.length - 1];
    } else if (!result.country) {
      result.country = 'USA';
    }
  } else if (parts.length === 1) {
    result.address_line1 = addressText;
    result.country = 'USA';
  }

  return result;
}
