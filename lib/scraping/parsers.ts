import * as cheerio from 'cheerio';

export interface ParsedDonorData {
  // Core Identification
  id?: string;
  name?: string;
  year_of_birth?: number;
  marital_status?: string;
  number_of_children?: number;

  // Demographics
  occupation?: string;
  education?: string;
  blood_type?: string;
  nationality_maternal?: string;
  nationality_paternal?: string;
  race?: string;
  cmv_status?: string;

  // Physical Attributes
  height_feet_inches?: string;
  height_cm?: number;
  weight_lbs?: number;
  weight_kg?: number;
  eye_color?: string;
  hair_color?: string;
  hair_texture?: string;
  hair_loss?: string;
  hair_type?: string;
  body_build?: string;
  freckles?: string;
  skin_tone?: string;

  // Genetic Testing
  genetic_tests_count?: number;
  genetic_test_results?: Record<string, any>;
  last_medical_history_update?: string;

  // Health Information
  health_info?: Record<string, any>;
  health_comments?: string;

  // Personality & Interests
  skills_hobbies_interests?: string;
  personality_description?: string;

  // Education Details
  education_details?: Record<string, any>;

  // Family Medical History
  immediate_family_history?: Record<string, any>;
  paternal_family_history?: Record<string, any>;
  maternal_family_history?: Record<string, any>;
  health_diseases?: Record<string, any>;

  // Purchase Options
  vial_options?: any[];
  compliance_flags?: Record<string, any>;
  audio_file_available?: boolean;
  photos_available?: boolean;
  inventory_summary?: string;
  inventory_data?: Record<string, any>;

  // Metadata
  profile_current_date?: string;
  document_id?: string;
  banner_message?: string;
}

export function parseBannerMessage(html: string): string | null {
  const $ = cheerio.load(html);
  
  // Look for banner message - could be in various places
  // Example: "More than 25 vials available!" or "More than 25 vials avail"
  const bannerSelectors = [
    '.inventory-summary',
    '[class*="banner"]',
    '[class*="inventory"]',
    'h2:contains("vials")',
    'h3:contains("vials")',
    '.xytex-authenticated', // WordPress theme specific
  ];

  for (const selector of bannerSelectors) {
    const text = $(selector).first().text().trim();
    if (text && (text.includes('vials') || text.includes('available') || text.includes('vials avail'))) {
      // Extract just the vial message part
      const vialMatch = text.match(/(More than \d+ vials (?:available|avail)[!.]?)/i);
      if (vialMatch) {
        return vialMatch[1].trim();
      }
      // If no match, return the text if it's short enough
      if (text.length < 100 && (text.includes('vials') || text.includes('available'))) {
        return text;
      }
    }
  }

  // Try to find text that mentions vials in body text
  const allText = $('body').text();
  const vialMatch = allText.match(/(More than \d+ vials (?:available|avail)[!.]?)/i);
  if (vialMatch) {
    return vialMatch[1].trim();
  }
  
  // Also try without the exclamation mark
  const vialMatch2 = allText.match(/(More than \d+ vials (?:available|avail))/i);
  if (vialMatch2) {
    return vialMatch2[1].trim() + '!';
  }

  return null;
}

export function parseDonorData(html: string, donorId: string): ParsedDonorData {
  const $ = cheerio.load(html);
  const data: ParsedDonorData = {
    id: donorId,
    banner_message: parseBannerMessage(html) || undefined,
  };

  // Extract document ID and profile date
  const documentIdMatch = html.match(/Document ID:\s*([A-F0-9]+)/i);
  if (documentIdMatch) {
    data.document_id = documentIdMatch[1];
  }

  const profileDateMatch = html.match(/profile is current as of:\s*([^<]+)/i);
  if (profileDateMatch) {
    data.profile_current_date = profileDateMatch[1].trim();
  }
  
  // Extract Donor ID from container if present (to verify we have the right donor)
  const donorIdMatch = html.match(/Donor ID:\s*(\d+)/i);
  if (donorIdMatch && donorIdMatch[1] !== donorId) {
    console.warn(`[PARSER] Donor ID mismatch: expected ${donorId}, found ${donorIdMatch[1]} in HTML`);
  }

  // Helper function to clean extracted text
  const cleanExtractedText = (text: string, maxLength: number = 500): string | null => {
    if (!text) return null;
    
    // Remove HTML tags
    let cleaned = text.replace(/<[^>]*>/g, '').trim();
    
    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Stop at common field separators or other labels
    const stopPatterns = [
      /\n.*?(Year of Birth|Marital Status|Occupation|Education|Blood Type|Height|Weight|CMV|Race|Nationality|Number of Children)/i,
      /\n\n/,
      /\.\s*(Year|Marital|Occupation|Education|Blood|Height|Weight|CMV|Race|Nationality|Number)/i,
    ];
    
    for (const pattern of stopPatterns) {
      const match = cleaned.match(pattern);
      if (match && match.index !== undefined) {
        cleaned = cleaned.substring(0, match.index).trim();
      }
    }
    
    // Limit length
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength).trim();
    }
    
    // Don't return if it looks like it contains multiple fields (has colons in the middle)
    const colonCount = (cleaned.match(/:/g) || []).length;
    if (colonCount > 1 && cleaned.length > 50) {
      // Take only the part before the second colon
      const parts = cleaned.split(':');
      if (parts.length > 1) {
        cleaned = parts[0].trim();
      }
    }
    
    // Validate: don't return if it's clearly not valid data
    // (e.g., contains only numbers when it should be text, or is too short to be meaningful)
    if (cleaned.length < 1) {
      return null;
    }
    
    // Don't return if it looks like HTML/script content
    if (cleaned.includes('<script') || cleaned.includes('javascript:') || cleaned.includes('onclick=')) {
      return null;
    }
    
    return cleaned || null;
  };

  // Extract basic info from structured sections
  // Improved to handle table rows, divs, and other structures more precisely
  const extractText = (label: string): string | null => {
    // Try multiple strategies to find the label and its value
    
    // Strategy 0: Look in WordPress content areas first (for XYtex WordPress theme)
    const wpContent = $('.entry-content, .post-content, .content, main, article, .xytex-authenticated').first();
    if (wpContent.length) {
      const contentText = wpContent.text();
      // Look for pattern like "Label: Value" in the content
      const labelPattern = new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:?\\s*([^\\n]{1,200})`, 'i');
      const match = contentText.match(labelPattern);
      if (match && match[1]) {
        const value = match[1].trim();
        // Stop at next label or newline
        const cleaned = value.split(/\n|Year of Birth|Marital Status|Occupation|Education|Blood Type|Height|Weight|CMV|Race|Nationality|Number of Children/i)[0].trim();
        if (cleaned && cleaned.length > 0) {
          return cleanExtractedText(cleaned);
        }
      }
    }
    
    // Strategy 1: Look for label in a table row (td or th containing label, next td has value)
    const tableRow = $(`tr:has(td:contains("${label}")), tr:has(th:contains("${label}"))`).first();
    if (tableRow.length) {
      const labelCell = tableRow.find(`td:contains("${label}"), th:contains("${label}")`).first();
      if (labelCell.length) {
        // Get the next cell (sibling) which should contain the value
        const valueCell = labelCell.next('td, th');
        if (valueCell.length) {
          const text = valueCell.text().trim();
          return cleanExtractedText(text);
        }
        // If no next cell, try getting text from same cell after the label
        const cellText = labelCell.text().trim();
        const afterLabel = cellText.replace(new RegExp(`.*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '').trim();
        if (afterLabel && afterLabel !== cellText) {
          return cleanExtractedText(afterLabel);
        }
      }
    }
    
    // Strategy 2: Look for label followed by value in same element (div, p, span, etc.)
    const labelElement = $(`*:contains("${label}")`).filter((_, el) => {
      const text = $(el).text().trim();
      return text.startsWith(label) || text.includes(label + ':');
    }).first();
    
    if (labelElement.length) {
      const fullText = labelElement.text().trim();
      // Try to extract just the part after the label
      const labelRegex = new RegExp(`^.*?${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:?\\s*`, 'i');
      const afterLabel = fullText.replace(labelRegex, '').trim();
      
      // Clean and return the extracted text
      if (afterLabel) {
        return cleanExtractedText(afterLabel);
      }
      
      // Fallback: try to get text from next sibling
      const nextSibling = labelElement.next();
      if (nextSibling.length) {
        const siblingText = nextSibling.text().trim();
        if (siblingText) {
          return cleanExtractedText(siblingText);
        }
      }
    }
    
    // Strategy 3: Look for label in a dt/dd structure
    const dtElement = $(`dt:contains("${label}")`).first();
    if (dtElement.length) {
      const ddElement = dtElement.next('dd');
      if (ddElement.length) {
        const text = ddElement.text().trim();
        return cleanExtractedText(text);
      }
    }
    
    return null;
  };

  // Core Identification - special handling for name to avoid grabbing too much text
  const extractName = (): string | null => {
    // Strategy 0: Look for name in the specific XYtex DOM structure
    // Exact path: div.donor-profile > div.container > div.row-full > div.right-cl > div.bio-info > p[0] > span
    // Try the full path first
    const donorProfile = $('div.donor-profile').first();
    if (donorProfile.length) {
      // Navigate through the exact path
      const rightCl = donorProfile.find('div.right-cl, .right-cl').first();
      if (rightCl.length) {
        const bioInfo = rightCl.find('div.bio-info, .bio-info').first();
        if (bioInfo.length) {
          // Get the first paragraph
          const firstP = bioInfo.find('p').first();
          if (firstP.length) {
            // Get the first span in that paragraph
            const nameSpan = firstP.find('span').first();
            if (nameSpan.length) {
              let name = nameSpan.text().trim();
              name = name.replace(/<[^>]*>/g, '').trim();
              // Validate it looks like a name (2-50 chars, letters, spaces, hyphens, apostrophes)
              if (name && name.length >= 2 && name.length <= 50 && /^[A-Za-z\s'-]+$/.test(name)) {
                return name;
              }
            }
            // Fallback: if no span, try the paragraph text itself
            let name = firstP.text().trim();
            name = name.replace(/<[^>]*>/g, '').trim();
            // Take first word or first few words that look like a name
            const nameMatch = name.match(/^([A-Za-z\s'-]{2,50})/);
            if (nameMatch && nameMatch[1]) {
              const extractedName = nameMatch[1].trim();
              if (extractedName.length >= 2 && extractedName.length <= 50 && /^[A-Za-z\s'-]+$/.test(extractedName)) {
                return extractedName;
              }
            }
          }
        }
      }
    }
    
    // Strategy 0.5: Direct search for bio-info (in case structure is slightly different)
    const bioInfo = $('div.bio-info, .bio-info').first();
    if (bioInfo.length) {
      // Look for span in the first paragraph of bio-info
      const firstP = bioInfo.find('p').first();
      if (firstP.length) {
        const nameSpan = firstP.find('span').first();
        if (nameSpan.length) {
          let name = nameSpan.text().trim();
          name = name.replace(/<[^>]*>/g, '').trim();
          // Validate it looks like a name
          if (name && name.length >= 2 && name.length <= 50 && /^[A-Za-z\s'-]+$/.test(name)) {
            return name;
          }
        }
        // Also try direct text in first p of bio-info
        let name = firstP.text().trim();
        name = name.replace(/<[^>]*>/g, '').trim();
        // Take first word or first few words that look like a name
        const nameMatch = name.match(/^([A-Za-z\s'-]{2,50})/);
        if (nameMatch && nameMatch[1]) {
          const extractedName = nameMatch[1].trim();
          if (extractedName.length >= 2 && extractedName.length <= 50 && /^[A-Za-z\s'-]+$/.test(extractedName)) {
            return extractedName;
          }
        }
      }
    }
    
    // Strategy 0.75: Look for name in right-cl div structure (broader search)
    const rightCl = $('div.right-cl, .right-cl').first();
    if (rightCl.length) {
      const bioInfoInRight = rightCl.find('div.bio-info, .bio-info').first();
      if (bioInfoInRight.length) {
        const firstP = bioInfoInRight.find('p').first();
        if (firstP.length) {
          const nameSpan = firstP.find('span').first();
          if (nameSpan.length) {
            let name = nameSpan.text().trim();
            name = name.replace(/<[^>]*>/g, '').trim();
            if (name && name.length >= 2 && name.length <= 50 && /^[A-Za-z\s'-]+$/.test(name)) {
              return name;
            }
          }
        }
      }
    }
    
    // Try multiple patterns for name - expanded list
    const namePatterns = [
      'Donor\'s "Name":',
      'Donor\'s Name:',
      'Donor Name:',
      'Name:',
      'Donor\'s Name',
      'Donor Name',
    ];
    
    // Strategy 0.75: Look for name in WordPress/XYtex specific structures
    // Check for patterns like "DONOR PROFILE : DONOR 96034" or similar
    const wpProfileMatch = html.match(/DONOR\s+PROFILE\s*:?\s*DONOR\s+\d+\s+([A-Za-z\s'-]+)/i);
    if (wpProfileMatch && wpProfileMatch[1]) {
      const name = wpProfileMatch[1].trim();
      if (name && name.length > 0 && name.length < 100 && /^[A-Za-z\s'-]+$/.test(name)) {
        return name;
      }
    }
    
    // Look for name in WordPress content areas
    const wpContent = $('.entry-content, .post-content, .content, main, article').first();
    if (wpContent.length) {
      const contentText = wpContent.text();
      // Look for patterns like "Name: John" or "Donor Name: John" in content
      const nameInContent = contentText.match(/(?:Donor['"]?s?\s+)?Name:?\s*([A-Za-z\s'-]{2,50})/i);
      if (nameInContent && nameInContent[1]) {
        const name = nameInContent[1].trim();
        if (name && name.length > 0 && name.length < 100 && /^[A-Za-z\s'-]+$/.test(name)) {
          return name;
        }
      }
    }
    
    for (const pattern of namePatterns) {
      // Strategy 1: Table row approach (most reliable)
      const tableRow = $(`tr:has(td:contains("${pattern}")), tr:has(th:contains("${pattern}"))`).first();
      if (tableRow.length) {
        const labelCell = tableRow.find(`td:contains("${pattern}"), th:contains("${pattern}")`).first();
        if (labelCell.length) {
          // Try next sibling cell first
          const valueCell = labelCell.next('td, th');
          if (valueCell.length) {
            let name = valueCell.text().trim();
            // Remove any HTML tags that might be in the text
            name = name.replace(/<[^>]*>/g, '').trim();
            // Clean up - take only first line, remove extra whitespace
            const cleanName = name.split(/\n|\.|,|;|\||Year of Birth|Marital Status|Occupation|Education|Blood Type|Height|Weight|CMV/i)[0].trim();
            // Validate: should be reasonable length, no colons (which indicate another field), and looks like a name
            if (cleanName && cleanName.length > 0 && cleanName.length < 100 && !cleanName.includes(':') && /^[A-Za-z\s'-]+$/.test(cleanName)) {
              return cleanName;
            }
          }
          // If next cell didn't work, try getting text from same cell after the label
          const cellText = labelCell.text().trim();
          const afterLabel = cellText.replace(new RegExp(`.*?${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:?\\s*`, 'i'), '').trim();
          if (afterLabel && afterLabel !== cellText) {
            const cleanName = afterLabel.split(/\n|\.|,|;|\||Year of Birth|Marital Status|Occupation|Education|Blood Type|Height|Weight|CMV/i)[0].trim();
            if (cleanName && cleanName.length > 0 && cleanName.length < 100 && !cleanName.includes(':') && /^[A-Za-z\s'-]+$/.test(cleanName)) {
              return cleanName;
            }
          }
        }
      }
      
      // Strategy 2: Look for label in dt/dd structure
      const dtElement = $(`dt:contains("${pattern}")`).first();
      if (dtElement.length) {
        const ddElement = dtElement.next('dd');
        if (ddElement.length) {
          let name = ddElement.text().trim();
          name = name.replace(/<[^>]*>/g, '').trim();
          const cleanName = name.split(/\n|\.|,|;|\||Year of Birth|Marital Status|Occupation|Education|Blood Type|Height|Weight|CMV/i)[0].trim();
          if (cleanName && cleanName.length > 0 && cleanName.length < 100 && !cleanName.includes(':') && /^[A-Za-z\s'-]+$/.test(cleanName)) {
            return cleanName;
          }
        }
      }
      
      // Strategy 3: Direct text extraction from elements containing the pattern
      const labelElement = $(`*:contains("${pattern}")`).filter((_, el) => {
        const text = $(el).text().trim();
        return text.includes(pattern) && (text.startsWith(pattern) || !!text.match(new RegExp(`${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:?`, 'i')));
      }).first();
      
      if (labelElement.length) {
        const fullText = labelElement.text().trim();
        const patternRegex = new RegExp(`.*?${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:?\\s*`, 'i');
        const afterPattern = fullText.replace(patternRegex, '').trim();
        
        if (afterPattern) {
          // Take only the first part, stop at newlines or other field indicators
          const name = afterPattern.split(/\n|Year of Birth|Marital Status|Occupation|Education|Blood Type|Height|Weight|CMV/i)[0].trim();
          // Remove any HTML and validate
          const cleanName = name.replace(/<[^>]*>/g, '').trim();
          if (cleanName && cleanName.length > 0 && cleanName.length < 100 && !cleanName.includes(':') && /^[A-Za-z\s'-]+$/.test(cleanName)) {
            return cleanName;
          }
        }
        
        // Fallback: try to get text from next sibling
        const nextSibling = labelElement.next();
        if (nextSibling.length) {
          let siblingText = nextSibling.text().trim();
          siblingText = siblingText.replace(/<[^>]*>/g, '').trim();
          const cleanName = siblingText.split(/\n|Year of Birth|Marital Status|Occupation|Education|Blood Type|Height|Weight|CMV/i)[0].trim();
          if (cleanName && cleanName.length > 0 && cleanName.length < 100 && !cleanName.includes(':') && /^[A-Za-z\s'-]+$/.test(cleanName)) {
            return cleanName;
          }
        }
      }
    }
    
    // Strategy 4: Look for name in common HTML structures (h1, h2, strong tags near "Donor" or "Name")
    const headingWithName = $('h1, h2, h3, strong, b').filter((_, el) => {
      const text = $(el).text().trim();
      return (text.includes('Donor') || text.includes('Name')) && text.length < 100;
    }).first();
    
    if (headingWithName.length) {
      const text = headingWithName.text().trim();
      // Try to extract just the name part (not "Donor Name: John" but just "John")
      const nameMatch = text.match(/(?:Donor['"]?s?\s+)?Name:?\s*([A-Za-z\s'-]+)/i);
      if (nameMatch && nameMatch[1]) {
        const cleanName = nameMatch[1].trim();
        if (cleanName.length > 0 && cleanName.length < 100 && /^[A-Za-z\s'-]+$/.test(cleanName)) {
          return cleanName;
        }
      }
    }
    
    return null;
  };
  
  data.name = extractName() || undefined;
  const yearOfBirth = extractText('Year of Birth:');
  if (yearOfBirth) {
    const year = parseInt(yearOfBirth, 10);
    // Validate year is reasonable (between 1950 and current year)
    const currentYear = new Date().getFullYear();
    if (!isNaN(year) && year >= 1950 && year <= currentYear) {
      data.year_of_birth = year;
    }
  }
  data.marital_status = extractText('Marital Status:') || undefined;
  const numChildren = extractText('Number of Children:');
  if (numChildren) {
    const children = parseInt(numChildren, 10);
    // Validate number of children is reasonable (0-20)
    if (!isNaN(children) && children >= 0 && children <= 20) {
      data.number_of_children = children;
    }
  }

  // Demographics
  data.occupation = extractText('Occupation:') || undefined;
  data.education = extractText('Education:') || undefined;
  data.blood_type = extractText('Blood Type:') || undefined;
  data.nationality_maternal = extractText('Maternal:') || undefined;
  data.nationality_paternal = extractText('Paternal:') || undefined;
  data.race = extractText('Race:') || undefined;
  data.cmv_status = extractText('CMV Status:') || undefined;

  // Physical Attributes - Extract from accordion section (#collapse1, #tpa)
  // Try accordion section first, then fallback to general extraction
  const physicalAttribSection = $('#collapse1, #tpa, [id*="collapse1"]').first();
  let physicalAttribText = '';
  
  if (physicalAttribSection.length) {
    // Get text from the row div within the collapse section
    const rowDiv = physicalAttribSection.find('div.row').first();
    if (rowDiv.length) {
      physicalAttribText = rowDiv.text();
    } else {
      physicalAttribText = physicalAttribSection.text();
    }
  }
  
  // Extract height
  const heightText = physicalAttribText ? 
    physicalAttribText.match(/Height:\s*([^W]+?)(?:\s+Weight:|$)/i)?.[1]?.trim() || extractText('Height:') :
    extractText('Height:');
  if (heightText) {
    const feetInches = heightText.split('(')[0].trim();
    // Validate height format (should contain feet/inches notation)
    if (feetInches && (feetInches.includes("'") || feetInches.includes('ft') || /^\d+['"]?\d*["']?$/.test(feetInches))) {
      data.height_feet_inches = feetInches;
    }
    const cmMatch = heightText.match(/\(([\d.]+)\s*cm\)/i);
    if (cmMatch) {
      const cm = parseFloat(cmMatch[1]);
      // Validate height in cm is reasonable (100-250 cm)
      if (!isNaN(cm) && cm >= 100 && cm <= 250) {
        data.height_cm = cm;
      }
    }
  }

  // Extract weight
  const weightText = physicalAttribText ?
    physicalAttribText.match(/Weight:\s*([^E]+?)(?:\s+Eye Color:|$)/i)?.[1]?.trim() || extractText('Weight:') :
    extractText('Weight:');
  if (weightText) {
    const lbsMatch = weightText.match(/(\d+)\s*lbs/i);
    if (lbsMatch) {
      const lbs = parseInt(lbsMatch[1], 10);
      // Validate weight in lbs is reasonable (80-400 lbs)
      if (!isNaN(lbs) && lbs >= 80 && lbs <= 400) {
        data.weight_lbs = lbs;
      }
    }
    const kgMatch = weightText.match(/\((\d+)\s*kg\)/i);
    if (kgMatch) {
      const kg = parseInt(kgMatch[1], 10);
      // Validate weight in kg is reasonable (35-180 kg)
      if (!isNaN(kg) && kg >= 35 && kg <= 180) {
        data.weight_kg = kg;
      }
    }
  }

  // Extract eye color - handle "Brown, Light" format
  const eyeColorText = physicalAttribText ?
    physicalAttribText.match(/Eye Color:\s*([^H]+?)(?:\s+Hair Color:|$)/i)?.[1]?.trim() || extractText('Eye Color:') :
    extractText('Eye Color:');
  if (eyeColorText) {
    // Clean up the eye color (remove extra descriptions)
    data.eye_color = eyeColorText.split(',')[0].trim();
  }

  // Extract hair color
  const hairColorText = physicalAttribText ?
    physicalAttribText.match(/Hair Color:\s*([^H]+?)(?:\s+Hair Texture:|$)/i)?.[1]?.trim() || extractText('Hair Color:') :
    extractText('Hair Color:');
  if (hairColorText) {
    data.hair_color = hairColorText.split(',')[0].trim();
  }

  data.hair_texture = extractText('Hair Texture:') || (physicalAttribText?.match(/Hair Texture:\s*([^H]+?)(?:\s+Hair Loss:|$)/i)?.[1]?.trim()) || undefined;
  data.hair_loss = extractText('Hair Loss:') || (physicalAttribText?.match(/Hair Loss:\s*([^H]+?)(?:\s+Hair Type:|$)/i)?.[1]?.trim()) || undefined;
  data.hair_type = extractText('Hair Type:') || (physicalAttribText?.match(/Hair Type:\s*([^D]+?)(?:\s+Dominant Hand:|$)/i)?.[1]?.trim()) || undefined;
  data.body_build = extractText('Body Build:') || undefined;
  data.freckles = extractText('Freckles:') || undefined;
  data.skin_tone = extractText('Skin Tone:') || undefined;
  
  // Extract additional physical attributes from accordion
  const dominantHand = physicalAttribText?.match(/Dominant Hand:\s*([^H]+?)(?:\s+Hairy Chest:|$)/i)?.[1]?.trim();
  const hairyChest = physicalAttribText?.match(/Hairy Chest:\s*([^H]+?)(?:\s+Hairy|$)/i)?.[1]?.trim();
  
  // Store additional attributes in health_info if they don't have dedicated fields
  if (dominantHand || hairyChest) {
    if (!data.health_info) {
      data.health_info = {};
    }
    if (dominantHand) {
      data.health_info.dominant_hand = dominantHand;
    }
    if (hairyChest) {
      data.health_info.hairy_chest = hairyChest;
    }
  }

  // Genetic Testing
  const geneticTestsMatch = html.match(/carrier testing included\s*(\d+)\s*genes/i);
  if (geneticTestsMatch) {
    const count = parseInt(geneticTestsMatch[1], 10);
    // Validate genetic tests count is reasonable (0-10000)
    if (!isNaN(count) && count >= 0 && count <= 10000) {
      data.genetic_tests_count = count;
    }
  }

  // Parse genetic test results - Extract from accordion section (#collapse3, #tgt)
  const geneticTestingSection = $('#collapse3, #tgt, [id*="collapse3"]').first();
  if (geneticTestingSection.length) {
    const contIn = geneticTestingSection.find('div.cont-in').first();
    if (contIn.length) {
      // Extract genetic testing info from the accordion
      const geneticText = contIn.text();
      
      // Update genetic test count if found in this section
      const countMatch = geneticText.match(/carrier testing included\s*(\d+)\s*genes/i);
      if (countMatch) {
        const count = parseInt(countMatch[1], 10);
        if (!isNaN(count) && count >= 0 && count <= 10000) {
          data.genetic_tests_count = count;
        }
      }
      
      // Parse genetic test results from this section
      const resultsFromSection = parseGeneticTestResultsFromAccordion(contIn, $);
      if (resultsFromSection && Object.keys(resultsFromSection).length > 0) {
        data.genetic_test_results = resultsFromSection;
      }
    }
  }
  
  // Fallback to general parsing
  if (!data.genetic_test_results || Object.keys(data.genetic_test_results).length === 0) {
    data.genetic_test_results = parseGeneticTestResults(html);
  }

  // Last Medical History Update
  data.last_medical_history_update = extractText('Last Medical History Update:') || undefined;

  // Personality Description - improved extraction from container
  // Look for "Meet The Donor" in the container structure
  const meetDonorElement = $('*:contains("Meet The Donor")').filter((_, el) => {
    const text = $(el).text().trim();
    return text.includes('Meet The Donor');
  }).first();
  
  if (meetDonorElement.length) {
    // Strategy 1: Get text from the parent container that contains "Meet The Donor"
    const container = meetDonorElement.closest('div.container, .container');
    if (container.length) {
      let containerText = container.text().trim();
      // Remove "Meet The Donor" and everything before it
      const meetDonorIndex = containerText.indexOf('Meet The Donor');
      if (meetDonorIndex !== -1) {
        containerText = containerText.substring(meetDonorIndex + 'Meet The Donor'.length).trim();
        // Remove "Donor ID: XXXX" if present at the start
        containerText = containerText.replace(/^Donor ID:\s*\d+\s*/i, '').trim();
        // Remove "Save to Favorites" and similar UI elements
        containerText = containerText.replace(/Save to Favorites/i, '').trim();
        containerText = containerText.replace(/HAVE A QUESTION ABOUT THIS DONOR\?/i, '').trim();
        // Stop at common section headers that might come after
        const stopPatterns = [
          /(Skills|Hobbies|Interests|Education|Health|Family|Medical)/i,
          /\n\n\n/,
        ];
        for (const pattern of stopPatterns) {
          const match = containerText.match(pattern);
          if (match && match.index !== undefined) {
            containerText = containerText.substring(0, match.index).trim();
          }
        }
        if (containerText && containerText.length > 10) {
          data.personality_description = containerText;
        }
      }
    }
    
    // Strategy 2: If container approach didn't work, try getting next sibling or parent text
    if (!data.personality_description) {
      const nextElement = meetDonorElement.next();
      if (nextElement.length) {
        let nextText = nextElement.text().trim();
        if (nextText && nextText.length > 10) {
          data.personality_description = nextText;
        }
      }
      // Try parent element
      if (!data.personality_description) {
        const parentText = meetDonorElement.parent().text().trim();
        const meetDonorIndex = parentText.indexOf('Meet The Donor');
        if (meetDonorIndex !== -1) {
          let parentAfter = parentText.substring(meetDonorIndex + 'Meet The Donor'.length).trim();
          parentAfter = parentAfter.replace(/^Donor ID:\s*\d+\s*/i, '').trim();
          if (parentAfter && parentAfter.length > 10) {
            data.personality_description = parentAfter;
          }
        }
      }
    }
  }

  // Donor Message - Extract from accordion section (#collapse2, #tmftd, div.donor-message)
  const donorMessageSection = $('#collapse2, #tmftd, [id*="collapse2"], div.donor-message').first();
  if (donorMessageSection.length) {
    const donorMessage = donorMessageSection.find('div.donor-message').first();
    if (donorMessage.length) {
      let messageText = donorMessage.text().trim();
      if (messageText && messageText.length > 10) {
        // Store in personality_description if we don't already have one, or append
        if (!data.personality_description) {
          data.personality_description = messageText;
        } else {
          // Append donor message to personality description
          data.personality_description = data.personality_description + '\n\n' + messageText;
        }
      }
    } else {
      // Try getting text directly from the collapse section
      let messageText = donorMessageSection.text().trim();
      // Remove section headers and UI elements
      messageText = messageText.replace(/Donor Message|Message from the Donor/i, '').trim();
      if (messageText && messageText.length > 10) {
        if (!data.personality_description) {
          data.personality_description = messageText;
        } else {
          data.personality_description = data.personality_description + '\n\n' + messageText;
        }
      }
    }
  }

  // Skills, Hobbies & Interests - Extract from accordion section (#collapse5, #tpia)
  const interestsSection = $('#collapse5, #tpia, [id*="collapse5"]').first();
  if (interestsSection.length) {
    const contIn = interestsSection.find('div.cont-in').first();
    if (contIn.length) {
      let interestsText = contIn.text().trim();
      // Remove common headers
      interestsText = interestsText.replace(/Favorite Hero:|Awards:|Perfect Day:|Personality:/i, '').trim();
      // Extract skills/hobbies if present
      const skillsMatch = interestsText.match(/(?:Skills|Hobbies|Interests):\s*(.+?)(?:\n|$)/i);
      if (skillsMatch) {
        data.skills_hobbies_interests = skillsMatch[1].trim();
      } else if (interestsText && interestsText.length > 20) {
        // Use the whole section if no specific label
        data.skills_hobbies_interests = interestsText;
      }
    }
  }
  
  // Fallback to general extraction
  if (!data.skills_hobbies_interests) {
    data.skills_hobbies_interests = extractText('Skills, Hobbies and Interests:') || undefined;
  }

  // Health Information - Extract from accordion section (#collapse4, #thi)
  const healthInfoSection = $('#collapse4, #thi, [id*="collapse4"]').first();
  if (healthInfoSection.length) {
    const healthRow = healthInfoSection.find('div.row').first();
    if (healthRow.length) {
      const healthText = healthRow.text();
      // Parse health info fields from the text
      const healthFields: Record<string, string> = {};
      const healthLabels = [
        'Medication Allergy', 'Food Allergy', 'Pet Allergy', 'Hay Fever Allergy',
        'Insect Allergy', 'Vaccine Allergy', 'Healthy Teeth', 'Braces',
        'Back Problems', 'Bronchitis', 'Chicken Pox', 'Vertigo',
        'Eyesight Correction', 'Skin Infection', 'Gallstones', 'Removed Gall Bladder',
        'Hernia', 'Mumps', 'Measles', 'German Measles', 'Sinus Infection', 'Stomach Ulcers'
      ];
      
      for (const label of healthLabels) {
        const match = healthText.match(new RegExp(`${label}:\\s*([^A-Z]+?)(?=\\s+[A-Z][a-z]+:|$)`, 'i'));
        if (match && match[1]) {
          healthFields[label.toLowerCase().replace(/\s+/g, '_')] = match[1].trim();
        }
      }
      
      if (Object.keys(healthFields).length > 0) {
        if (!data.health_info) {
          data.health_info = {};
        }
        Object.assign(data.health_info, healthFields);
      }
    }
  }

  // Health Comments
  data.health_comments = extractText('Comments:') || undefined;

  // Compliance Flags
  data.compliance_flags = {
    canadian_compliant: html.includes('Canadian Compliant'),
    uk_compliant: html.includes('UK Compliant'),
    colorado_compliant: html.includes('Colorado Compliant'),
  };

  // Audio File and Photos
  data.audio_file_available = html.includes('Audio File');
  data.photos_available = html.includes('View Donor Photos') || html.includes('has more photos');

  // Parse vial options from purchase section
  data.vial_options = parseVialOptions(html);

  // Parse family history tables - Extract from accordion sections
  // Immediate Family History (#collapse9, #tifmh)
  const immediateFamilySection = $('#collapse9, #tifmh, [id*="collapse9"]').first();
  if (immediateFamilySection.length) {
    const contIn = immediateFamilySection.find('div.cont-in').first();
    if (contIn.length) {
      data.immediate_family_history = parseFamilyHistoryFromAccordion(contIn, $);
    }
  }
  if (!data.immediate_family_history) {
    data.immediate_family_history = parseFamilyHistoryTable(html, 'IMMEDIATE FAMILY');
  }
  
  // Paternal Family History (#collapse10, #tpfmh)
  const paternalFamilySection = $('#collapse10, #tpfmh, [id*="collapse10"]').first();
  if (paternalFamilySection.length) {
    const contIn = paternalFamilySection.find('div.cont-in').first();
    if (contIn.length) {
      data.paternal_family_history = parseFamilyHistoryFromAccordion(contIn, $);
    }
  }
  if (!data.paternal_family_history) {
    data.paternal_family_history = parseFamilyHistoryTable(html, 'PATERNAL FAMILY');
  }
  
  // Maternal Family History (#collapse11, #tmfmh)
  const maternalFamilySection = $('#collapse11, #tmfmh, [id*="collapse11"]').first();
  if (maternalFamilySection.length) {
    const contIn = maternalFamilySection.find('div.cont-in').first();
    if (contIn.length) {
      data.maternal_family_history = parseFamilyHistoryFromAccordion(contIn, $);
    }
  }
  if (!data.maternal_family_history) {
    data.maternal_family_history = parseFamilyHistoryTable(html, 'MATERNAL FAMILY');
  }

  // Parse health & diseases table - Extract from accordion section (#collapse8, #thd)
  const healthDiseasesSection = $('#collapse8, #thd, [id*="collapse8"]').first();
  if (healthDiseasesSection.length) {
    const contIn = healthDiseasesSection.find('div.cont-in').first();
    if (contIn.length) {
      data.health_diseases = parseHealthDiseasesFromAccordion(contIn, $);
    }
  }
  if (!data.health_diseases || Object.keys(data.health_diseases).length === 0) {
    data.health_diseases = parseHealthDiseasesTable(html);
  }

  // Parse health information
  data.health_info = parseHealthInfo(html);

  // Parse education details - Extract from accordion section (#collapse7, #tbe)
  const birthEducationSection = $('#collapse7, #tbe, [id*="collapse7"]').first();
  if (birthEducationSection.length) {
    const birthEdRow = birthEducationSection.find('div.row').first();
    if (birthEdRow.length) {
      const birthEdText = birthEdRow.text();
      
      // Parse birth and education details
      const birthEdDetails: Record<string, any> = {};
      
      // Birth details
      const carriedToTerm = birthEdText.match(/Carried to Term:\s*([^P]+?)(?:\s+Pregnancy Complications:|$)/i)?.[1]?.trim();
      if (carriedToTerm) birthEdDetails.carried_to_term = carriedToTerm.toLowerCase() === 'yes';
      
      const pregComplications = birthEdText.match(/Pregnancy Complications:\s*([^B]+?)(?:\s+Birth Weight:|$)/i)?.[1]?.trim();
      if (pregComplications) birthEdDetails.pregnancy_complications = pregComplications.toLowerCase() === 'yes';
      
      const birthWeight = birthEdText.match(/Birth Weight:\s*([^C]+?)(?:\s+Childhood Health:|$)/i)?.[1]?.trim();
      if (birthWeight) birthEdDetails.birth_weight = birthWeight;
      
      const childhoodHealth = birthEdText.match(/Childhood Health:\s*([^B]+?)(?:\s+Birth Length:|$)/i)?.[1]?.trim();
      if (childhoodHealth) birthEdDetails.childhood_health = childhoodHealth;
      
      const birthLength = birthEdText.match(/Birth Length:\s*([^T]+?)(?:\s+Twin:|$)/i)?.[1]?.trim();
      if (birthLength) birthEdDetails.birth_length = birthLength;
      
      const twin = birthEdText.match(/Twin:\s*([^T]+?)(?:\s+Twin Type:|$)/i)?.[1]?.trim();
      if (twin) birthEdDetails.twin = twin.toLowerCase() === 'yes';
      
      // Education details
      const inSchool = birthEdText.match(/In School:\s*([^I]+?)(?:\s+Is the donor|$)/i)?.[1]?.trim();
      if (inSchool) birthEdDetails.in_school = inSchool.toLowerCase() === 'yes';
      
      // Merge with existing education_details if any
      if (Object.keys(birthEdDetails).length > 0) {
        if (!data.education_details) {
          data.education_details = {};
        }
        Object.assign(data.education_details, birthEdDetails);
      }
    }
  }
  
  // Parse education details from general parsing
  const generalEducationDetails = parseEducationDetails(html);
  if (generalEducationDetails && Object.keys(generalEducationDetails).length > 0) {
    if (!data.education_details) {
      data.education_details = {};
    }
    Object.assign(data.education_details, generalEducationDetails);
  }

  return data;
}

function parseGeneticTestResultsFromAccordion(
  contIn: any,
  $: cheerio.CheerioAPI
): Record<string, any> {
  const results: Record<string, any> = {};
  
  // Look for test results - format: "Condition Name (GENE)" followed by "No disease-causing variants detected"
  contIn.find('*').each((_: number, el: any) => {
    const text = $(el).text().trim();
    if (text.includes('No disease-causing variants detected') || 
        text.includes('No pathogenic variants detected')) {
      // Try to find the condition name before this
      const prevText = $(el).prev().text().trim();
      // Validate: condition name should be reasonable length and not contain HTML/script tags
      if (prevText && prevText.length > 0 && prevText.length < 200 && 
          !prevText.includes('<script') && !prevText.includes('javascript:')) {
        // Clean up condition name - remove extra whitespace and HTML
        const cleanCondition = prevText.replace(/<[^>]*>/g, '').trim();
        if (cleanCondition) {
          results[cleanCondition] = 'negative';
        }
      }
    }
  });
  
  return results;
}

function parseGeneticTestResults(html: string): Record<string, any> {
  const results: Record<string, any> = {};
  const $ = cheerio.load(html);

  // Find genetic testing section
  const geneticSection = $('*:contains("GENETIC TESTING")').parent();
  
  // Look for test results - format: "Condition Name (GENE)" followed by "No disease-causing variants detected"
  geneticSection.find('*').each((_: number, el: any) => {
    const text = $(el).text().trim();
    if (text.includes('No disease-causing variants detected') || 
        text.includes('No pathogenic variants detected')) {
      // Try to find the condition name before this
      const prevText = $(el).prev().text().trim();
      // Validate: condition name should be reasonable length and not contain HTML/script tags
      if (prevText && prevText.length > 0 && prevText.length < 200 && 
          !prevText.includes('<script') && !prevText.includes('javascript:')) {
        // Clean up condition name - remove extra whitespace and HTML
        const cleanCondition = prevText.replace(/<[^>]*>/g, '').trim();
        if (cleanCondition) {
          results[cleanCondition] = 'negative';
        }
      }
    }
  });

  return results;
}

function parseVialOptions(html: string): any[] {
  const vialOptions: any[] = [];
  const $ = cheerio.load(html);

  // Look for vial type table or list
  $('table, [class*="vial"]').each((_: number, table: any) => {
    const rows = $(table).find('tr');
    rows.each((_, row) => {
      const cells = $(row).find('td, th');
      if (cells.length >= 3) {
        const type = $(cells[0]).text().trim();
        const mot = $(cells[1]).text().trim();
        const inStock = $(cells[2]).text().trim();
        const price = $(cells[3] || cells[2]).text().trim();

        if (type && type.includes('Identity Disclosure')) {
          vialOptions.push({
            type,
            mot,
            in_stock: inStock,
            price,
          });
        }
      }
    });
  });

  return vialOptions;
}

function parseFamilyHistoryFromAccordion(
  contIn: any,
  $: cheerio.CheerioAPI
): Record<string, any> {
  const result: Record<string, any> = {};
  const text = contIn.text();
  
  // Remove disclaimer text
  let cleanText = text.replace(/Information displayed in this profile.*?not available\./i, '').trim();
  
  // Split by "FAMILY MEMBER:" to get individual members
  const members = cleanText.split(/FAMILY MEMBER:/i);
  
  for (const memberText of members) {
    if (!memberText.trim()) continue;
    
    // Extract member type (first word after "FAMILY MEMBER:")
    const memberTypeMatch = memberText.match(/^\s*([A-Za-z]+)/);
    if (!memberTypeMatch) continue;
    
    const memberType = memberTypeMatch[1].toLowerCase();
    const memberData: Record<string, any> = {};
    
    // Extract fields like "Hair Color: Black", "Eyesight: Free", etc.
    const fieldPatterns = [
      /Hair Color:\s*([^\n]+)/i,
      /Eyesight:\s*([^\n]+)/i,
      /Height:\s*([^\n]+)/i,
      /Weight:\s*([^\n]+)/i,
      /Build:\s*([^\n]+)/i,
      /Complexion:\s*([^\n]+)/i,
      /Education:\s*([^\n]+)/i,
      /Occupation:\s*([^\n]+)/i,
    ];
    
    for (const pattern of fieldPatterns) {
      const match = memberText.match(pattern);
      if (match && match[1]) {
        const fieldName = pattern.toString().match(/([A-Za-z\s]+):/)?.[1]?.trim().toLowerCase().replace(/\s+/g, '_');
        if (fieldName) {
          memberData[fieldName] = match[1].trim();
        }
      }
    }
    
    if (Object.keys(memberData).length > 0) {
      result[memberType] = memberData;
    }
  }
  
  return result;
}

function parseFamilyHistoryTable(html: string, sectionType: string): Record<string, any> {
  const $ = cheerio.load(html);
  const result: Record<string, any> = {};

  // Find the section
  const section = $(`*:contains("${sectionType}")`).parent();
  const tables = section.find('table');

  tables.each((_: number, table: any) => {
    const rows = $(table).find('tr');
    rows.each((_, row) => {
      const cells = $(row).find('td, th');
      if (cells.length > 0) {
        const memberType = $(cells[0]).text().trim();
        if (memberType && memberType !== 'FAMILY MEMBER:') {
          const memberData: Record<string, any> = {};
          cells.each((idx, cell) => {
            const label = $(cell).find('strong, b').text().trim();
            const value = $(cell).text().replace(label, '').trim();
            if (label) {
              memberData[label.toLowerCase().replace(/\s+/g, '_')] = value;
            }
          });
          result[memberType.toLowerCase()] = memberData;
        }
      }
    });
  });

  return result;
}

function parseHealthDiseasesFromAccordion(
  contIn: any,
  $: cheerio.CheerioAPI
): Record<string, any> {
  const result: Record<string, any> = {};
  const text = contIn.text();
  
  // Look for table structure or text patterns
  const tables = contIn.find('table');
  
  if (tables.length > 0) {
    // Use existing table parsing logic
    tables.each((_: number, table: any) => {
      const rows = $(table).find('tr');
      rows.each((_: number, row: any) => {
        const cells = $(row).find('td');
        if (cells.length >= 6) {
          const condition = $(cells[0]).text().trim();
          const hasCondition = $(cells[1]).text().trim().includes('X') || $(cells[1]).text().trim().toLowerCase() === 'yes';
          const relative = $(cells[2]).text().trim();
          const fatherSide = $(cells[3]).text().trim().includes('X') || $(cells[3]).text().trim().toLowerCase() === 'yes';
          const motherSide = $(cells[4]).text().trim().includes('X') || $(cells[4]).text().trim().toLowerCase() === 'yes';
          const ageOfOnset = $(cells[5]).text().trim();

          if (condition && hasCondition) {
            result[condition] = {
              relative,
              father_side: fatherSide,
              mother_side: motherSide,
              age_of_onset: ageOfOnset,
            };
          }
        }
      });
    });
  }
  
  return result;
}

function parseHealthDiseasesTable(html: string): Record<string, any> {
  const $ = cheerio.load(html);
  const result: Record<string, any> = {};

  // Find health & diseases section
  const section = $('*:contains("HEALTH & DISEASES")').parent();
  const tables = section.find('table');

  tables.each((_: number, table: any) => {
    const rows = $(table).find('tr');
    rows.each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 6) {
        const condition = $(cells[0]).text().trim();
        const hasCondition = $(cells[1]).text().trim().includes('X');
        const relative = $(cells[2]).text().trim();
        const fatherSide = $(cells[3]).text().trim().includes('X');
        const motherSide = $(cells[4]).text().trim().includes('X');
        const ageOfOnset = $(cells[5]).text().trim();

        if (condition && hasCondition) {
          result[condition] = {
            relative,
            father_side: fatherSide,
            mother_side: motherSide,
            age_of_onset: ageOfOnset,
          };
        }
      }
    });
  });

  return result;
}

function parseHealthInfo(html: string): Record<string, any> {
  const $ = cheerio.load(html);
  const result: Record<string, any> = {};

  // Find health information section
  const section = $('*:contains("HEALTH INFORMATION")').parent();
  
  // Look for key-value pairs
  const labels = [
    'Medication Allergy',
    'Food Allergy',
    'Pet Allergy',
    'Hay Fever Allergy',
    'Insect Allergy',
    'Vaccine Allergy',
    'Healthy Teeth',
    'Braces',
    'Back Problems',
    'Bronchitis',
    'Chicken Pox',
    'Vertigo',
    'Eyesight Correction',
    'Skin Infection',
    'Gallstones',
    'Removed Gall Bladder',
    'Hernia',
    'Mumps',
    'Measles',
    'German Measles',
    'Sinus Infection',
    'Stomach Ulcers',
  ];

  labels.forEach((label) => {
    const value = extractTextFromSection(section, label);
    if (value !== null) {
      result[label.toLowerCase().replace(/\s+/g, '_')] = value;
    }
  });

  return result;
}

function extractTextFromSection($section: any, label: string): string | null {
  const labelElement = $section.find(`*:contains("${label}")`).filter((_: number, el: any) => {
    return $section.find(el).text().trim().startsWith(label);
  }).first();

  if (labelElement.length) {
    const text = labelElement.text().replace(label, '').trim();
    return text || null;
  }
  return null;
}

function parseEducationDetails(html: string): Record<string, any> {
  const $ = cheerio.load(html);
  const result: Record<string, any> = {};

  // Find education information section
  const section = $('*:contains("EDUCATION INFORMATION")').parent();

  result.in_school = extractTextFromSection(section, 'In School:') === 'Yes';
  result.has_undergraduate = extractTextFromSection(section, 'undergraduate degree?') === 'Yes';
  result.degree_earned = extractTextFromSection(section, 'Degree Earned/Working towards:');
  result.degree_status = extractTextFromSection(section, 'Degree Status:');
  result.major = extractTextFromSection(section, 'Major:');
  result.minor = extractTextFromSection(section, 'Minor:');
  result.has_graduate = extractTextFromSection(section, 'graduate degree?') === 'Yes';
  result.graduate_degree = extractTextFromSection(section, 'Degree Earned/Working towards:');
  result.has_specialized_training = extractTextFromSection(section, 'specialized training') === 'Yes';

  return result;
}

export function parseInventoryData(html: string, donorId: string): Record<string, any> | null {
  const $ = cheerio.load(html);
  const result: Record<string, any> = {
    donor_id: donorId,
  };

  console.log(`[INVENTORY ${donorId}] Parsing FULL donor status report from HTML (${html.length} chars)`);

  // 1. Extract header info (Rating, Date of Last P2, Colorado Compliant) from table structure
  // Look for table with "Rating:" and "Date of Last P2:"
  const headerTable = $('table').filter((_, el) => {
    const text = $(el).text();
    return text.includes('Rating:') && text.includes('Date of Last P2:');
  }).first();
  
  if (headerTable.length) {
    const ratingText = headerTable.find('td:contains("Rating:")').text();
    const ratingMatch = ratingText.match(/Rating:\s*<b>([^<]+)<\/b>/i) || ratingText.match(/Rating:\s*([A-Z0-9-]+)/i);
    if (ratingMatch) {
      result.rating = ratingMatch[1].trim();
    }
    
    const lastP2Text = headerTable.find('td:contains("Date of Last P2:")').text();
    const lastP2Match = lastP2Text.match(/Date of Last P2:\s*<b>([^<]+)<\/b>/i) || lastP2Text.match(/Date of Last P2:\s*([\d\/]+)/i);
    if (lastP2Match) {
      result.date_of_last_p2 = lastP2Match[1].trim();
    }
  }
  
  // Colorado Compliant - look for table row containing it
  const coloradoRow = $('td').filter((_, el) => {
    return $(el).text().trim().toLowerCase().includes('colorado compliant:');
  }).first();
  
  if (coloradoRow.length) {
    const coloradoText = coloradoRow.text();
    const coloradoMatch = coloradoText.match(/Colorado Compliant:\s*(yes|no)/i);
    if (coloradoMatch) {
      result.colorado_compliant = coloradoMatch[1].toLowerCase() === 'yes';
    }
  }

  // 2. Parse Inventory Data section
  const inventoryData = parseInventorySection($, donorId);
  if (inventoryData) {
    Object.assign(result, inventoryData);
  }

  // 3. Parse Sales Data section (this also extracts total_units_donor_testing and total_units_sage)
  const salesData = parseSalesDataSection($, donorId);
  if (salesData) {
    result.sales_data = salesData;
    // Copy totals if found in sales data
    if (salesData.total_units_donor_testing !== undefined) {
      result.total_units_donor_testing = salesData.total_units_donor_testing;
    }
    if (salesData.total_units_sage !== undefined) {
      result.total_units_sage = salesData.total_units_sage;
    }
  }

  // 4. Parse Family Units section
  const familyUnits = parseFamilyUnitsSection($, donorId);
  if (familyUnits) {
    result.family_units = familyUnits;
  }

  // 5. Parse Advisories
  const advisoriesHeading = $('h3').filter((_, el) => $(el).text().trim() === 'Advisories').first();
  if (advisoriesHeading.length) {
    const advisoriesText = advisoriesHeading.closest('tr').next('tr').find('td').text().trim();
    if (advisoriesText) {
      result.advisories = advisoriesText;
    }
  }

  // 6. Parse Canadian Sibling Only Status
  const canadianStatus = parseCanadianSiblingStatus($, donorId);
  if (canadianStatus) {
    result.canadian_sibling_status = canadianStatus;
  }

  // 7. Parse Birth Limit Category
  const birthLimitHeading = $('h3').filter((_, el) => $(el).text().trim() === 'Birth Limit Category').first();
  if (birthLimitHeading.length) {
    const birthLimitText = birthLimitHeading.closest('tr').next('tr').find('td').text().trim();
    if (birthLimitText) {
      result.birth_limit_category = birthLimitText;
    }
  }

  // 8. Extract totals from Donor Testing and Sage (already done in parseSalesDataSection, but check if not found)
  if (!result.total_units_donor_testing) {
    const bodyText = $('body').text();
    const donorTestingMatch = bodyText.match(/Total Units Ever Created \(DonorTesting\)\s*(\d+)/i);
    if (donorTestingMatch) {
      result.total_units_donor_testing = parseInt(donorTestingMatch[1], 10);
    }
  }

  if (!result.total_units_sage) {
    const bodyText = $('body').text();
    const sageMatch = bodyText.match(/Total Units Ever Created \(Sage\)\s*(\d+)/i);
    if (sageMatch) {
      result.total_units_sage = parseInt(sageMatch[1], 10);
    }
  }

  console.log(`[INVENTORY ${donorId}] Parsed all sections. Keys:`, Object.keys(result));
  return result;
}

function parseInventorySection($: cheerio.CheerioAPI, donorId: string): Record<string, any> | null {
  // Find the inventory data table - it's inside a div with id "div_inventory_data_wrapper"
  const inventoryWrapper = $('#div_inventory_data_wrapper');
  if (!inventoryWrapper.length) {
    console.log(`[INVENTORY ${donorId}] Inventory Data wrapper not found`);
    return null;
  }

  console.log(`[INVENTORY ${donorId}] Found Inventory Data wrapper`);

  const result: Record<string, any> = {
    finished: {
      unwashed: {},
      washed: {},
      art: {},
      other: {},
    },
    quarantine: {
      unwashed: 0,
      washed: 0,
      art: 0,
      washed_cc: 0,
      unwashed_cc: 0,
    },
    unit_types: {},
  };

  // Parse the nested table structure
  const table = inventoryWrapper.find('table.table_contains_data').first();
  const rows = table.find('tr');
  
  let currentCategory = '';
  let currentSubCategory = '';
  
  rows.each((_, row) => {
    const cells = $(row).find('td');
    const cellTexts = cells.map((_, cell) => $(cell).text().trim()).get();
    const rowText = cellTexts.join(' ').toLowerCase();
    
    // Debug: log row structure for troubleshooting
    if (process.env.NODE_ENV === 'development' && rowText.includes('quarantine')) {
      console.log(`[INVENTORY ${donorId}] Row structure:`, {
        cellCount: cells.length,
        cellTexts,
        firstCellRowspan: cells.first().attr('rowspan'),
        firstCellColspan: cells.first().attr('colspan'),
        secondCellColspan: cells.eq(1).attr('colspan'),
      });
    }
    
    // Check for "Finished" category (has rowspan="14")
    if (cells.first().attr('rowspan') === '14' && rowText.includes('finished')) {
      currentCategory = 'finished';
      currentSubCategory = '';
      // Check if this row also has a unit type (MKT, AAF, AFE)
      if (cellTexts.length >= 3) {
        const unitType = cellTexts[1]?.trim().toUpperCase();
        const count = parseInt(cellTexts[2] || '0', 10);
        if (unitType && count >= 0) {
          result.finished.other[unitType] = count;
          if (!result.unit_types[unitType]) result.unit_types[unitType] = 0;
          result.unit_types[unitType] += count;
        }
      }
      return;
    }
    
    // Check for subcategories within Finished (rowspan="4" or "3")
    if (currentCategory === 'finished') {
      const rowspan = cells.first().attr('rowspan');
      if (rowspan === '4' || rowspan === '3') {
        const subcatText = cells.first().text().trim().toLowerCase();
        if (subcatText === 'unwashed') {
          currentSubCategory = 'unwashed';
        } else if (subcatText === 'washed') {
          currentSubCategory = 'washed';
        } else if (subcatText === 'art') {
          currentSubCategory = 'art';
        }
        // Parse unit type in this row
        if (cellTexts.length >= 3) {
          const unitType = cellTexts[1]?.trim().toUpperCase();
          const count = parseInt(cellTexts[2] || '0', 10);
          if (unitType && count >= 0) {
            if (currentSubCategory === 'unwashed') {
              result.finished.unwashed[unitType] = count;
            } else if (currentSubCategory === 'washed') {
              result.finished.washed[unitType] = count;
            } else if (currentSubCategory === 'art') {
              result.finished.art[unitType] = count;
            }
            if (!result.unit_types[unitType]) result.unit_types[unitType] = 0;
            result.unit_types[unitType] += count;
          }
        }
        return;
      }
      
      // Regular unit type rows (no rowspan, just unit type and count)
      if (!cells.first().attr('rowspan') && cellTexts.length >= 2) {
        const unitType = cellTexts[0]?.trim().toUpperCase();
        const count = parseInt(cellTexts[1] || '0', 10);
        if (unitType && count >= 0 && !['FINISHED', 'QUARANTINE', 'UNWASHED', 'WASHED', 'ART', 'TOTAL'].includes(unitType)) {
          if (currentSubCategory === 'unwashed') {
            result.finished.unwashed[unitType] = count;
          } else if (currentSubCategory === 'washed') {
            result.finished.washed[unitType] = count;
          } else if (currentSubCategory === 'art') {
            result.finished.art[unitType] = count;
          }
          if (!result.unit_types[unitType]) result.unit_types[unitType] = 0;
          result.unit_types[unitType] += count;
        }
        return;
      }
    }
    
    // Check for "Quarantine" category (rowspan="5")
    // Structure: Row with "Quarantine" in first cell (rowspan="5"), "Unwashed" in second cell (colspan="2"), value in third cell
    const firstCell = cells.first();
    const firstCellRowspan = firstCell.attr('rowspan');
    const firstCellText = firstCell.text().trim().toLowerCase();
    
    if (firstCellRowspan === '5' && firstCellText === 'quarantine') {
      currentCategory = 'quarantine';
      // The first row also contains "Unwashed" and its value
      // Structure: td[0] = "Quarantine" (rowspan="5"), td[1] = "Unwashed" (colspan="2"), td[2] = value "5"
      if (cellTexts.length >= 3) {
        const secondCellText = cellTexts[1]?.trim().toLowerCase();
        const count = parseInt(cellTexts[2] || '0', 10);
        
        if (secondCellText === 'unwashed') {
          result.quarantine.unwashed = count;
        }
      }
      return;
    }
    
    // Quarantine values - subsequent rows after the "Quarantine" header row
    if (currentCategory === 'quarantine') {
      // Structure for quarantine rows:
      // Row 15+: The "Quarantine" cell from row 14 spans down (rowspan="5"), so it's not in these rows
      // td[0] = label (colspan="2" for Washed, ART, Washed CC, Unwashed CC), td[1] = value
      // OR for Total: td[0] = "Total" (colspan="3"), td[1] = value
      if (cellTexts.length >= 2) {
        const firstCell = cells.first();
        const firstCellColspan = firstCell.attr('colspan');
        const firstCellText = cellTexts[0]?.trim().toLowerCase();
        
        // Check for Total row first (colspan="3")
        if (firstCellColspan === '3' && firstCellText === 'total') {
          const totalCount = parseInt(cellTexts[1] || '0', 10);
          if (totalCount > 0) {
            // Verify our calculated total matches
            const calculatedTotal = 
              result.quarantine.unwashed + 
              result.quarantine.washed + 
              result.quarantine.art + 
              result.quarantine.washed_cc + 
              result.quarantine.unwashed_cc;
            if (Math.abs(calculatedTotal - totalCount) > 1) {
              console.warn(`[INVENTORY ${donorId}] Quarantine total mismatch: calculated ${calculatedTotal}, found ${totalCount}`);
            }
          }
          // Exit quarantine category after total row
          currentCategory = '';
          return;
        }
        
        // For other quarantine rows: label in td[0] (may have colspan="2"), value in td[1]
        let label: string;
        let count: number;
        
        if (firstCellColspan === '2') {
          // Label spans 2 columns, value is in the next cell (td[1])
          label = firstCellText;
          count = parseInt(cellTexts[1] || '0', 10);
        } else {
          // Standard structure: label in td[0], value in td[1]
          label = firstCellText;
          count = parseInt(cellTexts[1] || '0', 10);
        }
        
        // Map labels to quarantine fields (case-insensitive)
        if (label === 'washed') {
          result.quarantine.washed = count;
        } else if (label === 'art') {
          result.quarantine.art = count;
        } else if (label === 'washed cc') {
          result.quarantine.washed_cc = count;
        } else if (label === 'unwashed cc') {
          result.quarantine.unwashed_cc = count;
        } else if (label === 'total') {
          // Total row - verify calculated total
          const totalCount = parseInt(cellTexts[cellTexts.length - 1] || '0', 10);
          if (totalCount > 0) {
            const calculatedTotal = 
              result.quarantine.unwashed + 
              result.quarantine.washed + 
              result.quarantine.art + 
              result.quarantine.washed_cc + 
              result.quarantine.unwashed_cc;
            if (Math.abs(calculatedTotal - totalCount) > 1) {
              console.warn(`[INVENTORY ${donorId}] Quarantine total mismatch: calculated ${calculatedTotal}, found ${totalCount}`);
            }
          }
          // Exit quarantine category after total row
          currentCategory = '';
        }
      }
      return;
    }
    
    // Total row
    if (rowText.includes('total') && cellTexts.length >= 2) {
      const totalText = cellTexts[cellTexts.length - 1]?.trim();
      const totalMatch = totalText.match(/(\d+)/);
      if (totalMatch) {
        const total = parseInt(totalMatch[1], 10);
        if (total > 10) {
          result.total_units = total;
        }
      }
    }
  });
  
  // Extract visits and avg from the right column
  // Strategy 1: Look for h3 followed by "Number of Total Visits" text
  // Structure: <h3>125</h3>Number of Total Visits
  const visitsH3 = $('h3').filter((_, el) => {
    const h3Text = $(el).text().trim();
    const nextText = $(el).next().text() || $(el).parent().text();
    // Check if this h3 is followed by "Number of Total Visits" or is in a td that contains that text
    return /^\d+$/.test(h3Text) && (nextText.includes('Number of Total Visits') || $(el).parent().text().includes('Number of Total Visits'));
  }).first();
  
  if (visitsH3.length) {
    const visitsText = visitsH3.text().trim();
    const visitsNum = parseInt(visitsText, 10);
    if (!isNaN(visitsNum) && visitsNum >= 0) {
      result.total_visits = visitsNum;
    }
  }
  
  // Strategy 2: Look in the right column td (vertical-align: top) that contains "Number of Total Visits"
  if (!result.total_visits) {
    const rightColumn = $('td').filter((_, el) => {
      const text = $(el).text();
      const style = $(el).attr('style') || '';
      return text.includes('Number of Total Visits') || 
             (style.includes('vertical-align') && text.includes('Total Visits'));
    }).first();
    
    if (rightColumn.length) {
      // Look for h3 in this td
      const h3InColumn = rightColumn.find('h3').first();
      if (h3InColumn.length) {
        const visitsText = h3InColumn.text().trim();
        const visitsNum = parseInt(visitsText, 10);
        if (!isNaN(visitsNum) && visitsNum >= 0) {
          result.total_visits = visitsNum;
        }
      } else {
        // Fallback: try regex match
        const visitsMatch = rightColumn.text().match(/(\d+)\s*Number of Total Visits/i) || 
                           rightColumn.text().match(/Number of Total Visits\s*(\d+)/i);
        if (visitsMatch && visitsMatch[1]) {
          result.total_visits = parseInt(visitsMatch[1], 10);
        }
      }
    }
  }
  
  // Strategy 3: Look for h3 in table structure (more specific path)
  if (!result.total_visits) {
    const fullWidthTable = $('table.app-full-width').first();
    if (fullWidthTable.length) {
      const rows = fullWidthTable.find('tbody tr');
      // Find the row that contains the inventory data wrapper
      rows.each((_: number, row: any) => {
        const rowEl = $(row);
        const inventoryWrapper = rowEl.find('#div_inventory_data_wrapper');
        if (inventoryWrapper.length) {
          // This row contains inventory data, check the next td (right column)
          const tds = rowEl.find('td');
          if (tds.length >= 2) {
            const rightTd = tds.eq(1); // Second td (index 1)
            const h3Element = rightTd.find('h3').first();
            if (h3Element.length) {
              const h3Text = h3Element.text().trim();
              const nextSiblingText = h3Element.next().text() || h3Element.parent().text();
              // Check if followed by "Number of Total Visits"
              if (/^\d+$/.test(h3Text) && nextSiblingText.includes('Number of Total Visits')) {
                const visitsNum = parseInt(h3Text, 10);
                if (!isNaN(visitsNum) && visitsNum >= 0) {
                  result.total_visits = visitsNum;
                  return false; // Break the loop
                }
              }
            }
          }
        }
      });
    }
  }
  
  // Extract average units per visit
  const rightColumn = $('td').filter((_, el) => {
    const text = $(el).text();
    return text.includes('Average Number of Units');
  }).first();
  
  if (rightColumn.length) {
    const avgMatch = rightColumn.text().match(/([\d.]+)\s*Average Number of Units/i);
    if (avgMatch) {
      result.avg_units_per_visit = parseFloat(avgMatch[1]);
    }
  }

  // Calculate totals
  result.quarantine.total = 
    result.quarantine.unwashed + 
    result.quarantine.washed + 
    result.quarantine.art + 
    result.quarantine.washed_cc + 
    result.quarantine.unwashed_cc;

  const finishedUnwashedTotal = Object.values(result.finished.unwashed).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);
  const finishedWashedTotal = Object.values(result.finished.washed).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);
  const finishedArtTotal = Object.values(result.finished.art).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);
  const finishedOtherTotal = Object.values(result.finished.other).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);
  result.finished.total = finishedUnwashedTotal + finishedWashedTotal + finishedArtTotal + finishedOtherTotal;

  if (!result.total_units) {
    result.total_units = result.finished.total + result.quarantine.total;
  }

  return result;
}

function parseSalesDataSection($: cheerio.CheerioAPI, donorId: string): Record<string, any> | null {
  // Find the Sales Data table - it's after the "Sales Data" h3 heading
  const salesHeading = $('h3').filter((_, el) => $(el).text().trim() === 'Sales Data').first();
  if (!salesHeading.length) {
    return null;
  }
  
  // Find the table after the heading
  const salesTable = salesHeading.closest('tr').nextAll('tr').find('table.table_contains_data').first();
  if (!salesTable.length) {
    return null;
  }

  const result: Record<string, any> = {
    current: {},
    ytd: {},
    previous_year: {},
    all_time: {},
  };

  // Parse table rows - skip header row
  const rows = salesTable.find('tr');
  rows.slice(1).each((_: number, row: any) => {
    const cells = $(row).find('td');
    const cellTexts = cells.map((_, cell) => $(cell).text().trim()).get();
    
    if (cellTexts.length >= 5) {
      const region = cellTexts[0].toLowerCase();
      if (['us', 'canada', "int'l", 'total'].includes(region)) {
        const regionKey = region === "int'l" ? 'intl' : region;
        result.current[regionKey] = parseInt(cellTexts[1] || '0', 10);
        result.ytd[regionKey] = parseInt(cellTexts[2] || '0', 10);
        result.previous_year[regionKey] = parseInt(cellTexts[3] || '0', 10);
        result.all_time[regionKey] = parseInt(cellTexts[4] || '0', 10);
      }
    }
  });

  // Also extract the totals from the right column
  const rightColumn = salesHeading.closest('tr').next('tr').find('td').last();
  if (rightColumn.length) {
    const donorTestingMatch = rightColumn.text().match(/Total Units Ever Created \(DonorTesting\)\s*(\d+)/i);
    if (donorTestingMatch) {
      result.total_units_donor_testing = parseInt(donorTestingMatch[1], 10);
    }
    
    const sageMatch = rightColumn.text().match(/Total Units Ever Created \(Sage\)\s*(\d+)/i);
    if (sageMatch) {
      result.total_units_sage = parseInt(sageMatch[1], 10);
    }
  }

  return Object.keys(result.current).length > 0 ? result : null;
}

function parseFamilyUnitsSection($: cheerio.CheerioAPI, donorId: string): Record<string, any> | null {
  // Find the Family Units table
  const familyHeading = $('h3').filter((_, el) => $(el).text().trim() === 'Family Units').first();
  if (!familyHeading.length) {
    return null;
  }
  
  const familyTable = familyHeading.closest('tr').nextAll('tr').find('table.table_contains_data').first();
  if (!familyTable.length) {
    return null;
  }

  const result: Record<string, any> = {};

  // Parse table rows
  const rows = familyTable.find('tr');
  rows.each((_, row) => {
    const cells = $(row).find('td');
    const cellTexts = cells.map((_, cell) => $(cell).text().trim()).get();
    
    if (cellTexts.length >= 2) {
      const label = cellTexts[0].toLowerCase();
      const count = parseInt(cellTexts[1] || '0', 10);
      
      if (label === 'us') {
        result.us = count;
      } else if (label === 'canada') {
        result.canada = count;
      } else if (label === "int'l") {
        result.intl = count;
      } else if (label === 'total') {
        result.total = count;
      }
    }
  });

  // Extract Family Unit Limit from right column
  const rightColumn = familyHeading.closest('tr').next('tr').find('td').last();
  if (rightColumn.length) {
    const limitText = rightColumn.text();
    const limitMatch = limitText.match(/(\d+)\s*\(([^)]+)\)\s*Family Unit Limit/i) || limitText.match(/Family Unit Limit\s*\(([^)]+)\)\s*(\d+)/i);
    if (limitMatch) {
      result.limit = parseInt(limitMatch[1] || limitMatch[2], 10);
      result.limit_type = (limitMatch[2] || limitMatch[1]).trim();
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function parseCanadianSiblingStatus($: cheerio.CheerioAPI, donorId: string): Record<string, any> | null {
  const canadianHeading = $('h3').filter((_, el) => $(el).text().trim() === 'Canadian Sibling Only Status').first();
  if (!canadianHeading.length) {
    return null;
  }

  const result: Record<string, any> = {};

  // Check if classified as sibling only
  const sectionText = canadianHeading.closest('tr').next('tr').find('td').text();
  const isSiblingOnly = !sectionText.toLowerCase().includes('not classified as a sibling only');
  result.is_sibling_only = isSiblingOnly;

  // Parse the table with Canadian data
  const canadianTable = canadianHeading.closest('tr').nextAll('tr').find('table.table_contains_data').first();
  if (canadianTable.length) {
    const rows = canadianTable.find('tr');
    rows.each((_, row) => {
      const cells = $(row).find('td');
      const cellTexts = cells.map((_, cell) => $(cell).text().trim()).get();
      
      if (cellTexts.length >= 2) {
        const label = cellTexts[0].toLowerCase();
        const count = parseInt(cellTexts[1] || '0', 10);
        
        if (label.includes('pregnancies')) {
          result.pregnancies = count;
        } else if (label.includes('births')) {
          result.births = count;
        } else if (label.includes('total combined')) {
          result.total_combined = count;
        }
      }
    });
  }

  return Object.keys(result).length > 0 ? result : null;
}

// Helper function to extract text between two section headers
function extractSectionText(bodyText: string, startSection: string, endSections: string[]): string | null {
  const startIndex = bodyText.toLowerCase().indexOf(startSection.toLowerCase());
  if (startIndex === -1) return null;

  let endIndex = bodyText.length;
  for (const endSection of endSections) {
    const idx = bodyText.toLowerCase().indexOf(endSection.toLowerCase(), startIndex + startSection.length);
    if (idx !== -1 && idx < endIndex) {
      endIndex = idx;
    }
  }

  return bodyText.substring(startIndex, endIndex);
}

