export interface ExtractedMetadata {
  title?: string;
  signedDate?: string;
  signerName?: string;
  signerEmail?: string;
}

/**
 * Extract metadata from a PDF file using pdf2json (Node.js-friendly)
 * Attempts to find dates, emails, and names in the PDF text
 */
export async function extractPdfMetadata(file: File | Buffer): Promise<ExtractedMetadata> {
  try {
    // Use pdf2json which is more Node.js-friendly and doesn't require workers
    const PDFParser = (await import('pdf2json')).default;
    
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    console.log('PDF extraction - Starting with pdf2json, data size:', buffer.length, 'bytes');

    return new Promise((resolve) => {
      const pdfParser = new PDFParser(null, true); // Second parameter is verbosity (boolean)
      let text = '';

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('PDF extraction - pdf2json parse error:', errData);
        // Return minimal metadata on error
        if (file instanceof File) {
          resolve({
            title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          });
        } else {
          resolve({});
        }
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          // Debug: Log PDF structure
          console.log('PDF extraction - PDF data structure:', {
            hasPages: !!pdfData.Pages,
            pageCount: pdfData.Pages?.length || 0,
            firstPageStructure: pdfData.Pages?.[0] ? Object.keys(pdfData.Pages[0]) : []
          });

          // Initialize metadata object
          const pdfMetadata: Partial<ExtractedMetadata> = {};

          // Check PDF metadata first (might contain title, author, etc.)
          if (pdfData.Meta) {
            console.log('PDF extraction - PDF Meta:', pdfData.Meta);
            // Meta might have Title, Author, etc.
            if (pdfData.Meta.Title) {
              pdfMetadata.title = pdfData.Meta.Title;
            }
          }

          // Check form fields (Fields might contain form data)
          let hasFormFields = false;
          if (pdfData.Pages && pdfData.Pages.length > 0) {
            for (let i = 0; i < pdfData.Pages.length; i++) {
              const page = pdfData.Pages[i];
              
              // Check for form fields on this page
              if (page.Fields && page.Fields.length > 0) {
                hasFormFields = true;
                console.log(`PDF extraction - Page ${i + 1} has ${page.Fields.length} form fields`);
                for (const field of page.Fields) {
                  if (field.V) {
                    // Field value
                    text += field.V + ' ';
                    console.log(`PDF extraction - Field ${field.T || 'unnamed'}: ${field.V}`);
                  }
                  if (field.T) {
                    // Field name/label
                    text += field.T + ' ';
                  }
                }
              }

              // Extract text from Texts array
              if (page.Texts && page.Texts.length > 0) {
                for (const textItem of page.Texts) {
                  // Try different text extraction methods
                  if (textItem.R && Array.isArray(textItem.R) && textItem.R.length > 0) {
                    // Standard pdf2json format: R array with T property
                    for (const r of textItem.R) {
                      if (r.T) {
                        try {
                          text += decodeURIComponent(r.T) + ' ';
                        } catch (e) {
                          // If decode fails, try using as-is
                          text += r.T + ' ';
                        }
                      }
                    }
                  } else if (textItem.T) {
                    // Direct T property
                    try {
                      text += decodeURIComponent(textItem.T) + ' ';
                    } catch (e) {
                      text += textItem.T + ' ';
                    }
                  } else if (textItem.text) {
                    // Alternative text property
                    text += textItem.text + ' ';
                  }
                }
              }
            }
          }

          // If no text and no form fields, this is likely an image-based PDF
          if (text.length === 0 && !hasFormFields) {
            console.warn('PDF extraction - PDF appears to be image-based (scanned). No extractable text found.');
            console.warn('PDF extraction - OCR would be required to extract text from image-based PDFs.');
          }

          console.log('PDF extraction - Text extracted, length:', text.length);
          if (text.length > 0) {
            console.log('PDF extraction - First 1000 chars:', text.substring(0, 1000));
            if (text.length > 1000) {
              console.log('PDF extraction - Last 500 chars:', text.substring(text.length - 500));
            }
          } else {
            console.warn('PDF extraction - No text extracted from PDF');
            // Log full structure for debugging
            console.log('PDF extraction - Full PDF data keys:', Object.keys(pdfData));
            if (pdfData.Pages && pdfData.Pages[0]) {
              console.log('PDF extraction - First page sample:', JSON.stringify(pdfData.Pages[0]).substring(0, 500));
            }
          }

          // Extract metadata from text (only if we have text)
          let extractedMetadata: ExtractedMetadata = {};
          
          // If we have a title from PDF Meta, use it
          if (pdfMetadata.title) {
            extractedMetadata.title = pdfMetadata.title;
          } else if (file instanceof File) {
            extractedMetadata.title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          }

          // Only try to extract from text if we have text
          if (text.length > 0) {
            const textMetadata = extractMetadataFromText(text, file);
            // Merge text metadata with existing metadata
            extractedMetadata = {
              ...extractedMetadata,
              ...textMetadata,
              // Don't override title if we already have one from Meta
              title: extractedMetadata.title || textMetadata.title
            };
          }

          console.log('PDF extraction - Final metadata:', extractedMetadata);
          resolve(extractedMetadata);
        } catch (extractError: any) {
          console.error('PDF extraction - Error extracting metadata:', extractError);
          // Return minimal metadata on error
          if (file instanceof File) {
            resolve({
              title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            });
          } else {
            resolve({});
          }
        }
      });

      // Parse the PDF
      pdfParser.parseBuffer(buffer);
    });
  } catch (error: any) {
    console.error('PDF extraction - Failed to import pdf2json:', {
      error: error.message,
      stack: error.stack
    });
    // Return minimal metadata from filename
    if (file instanceof File) {
      return {
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      };
    }
    return {};
  }
}

/**
 * Extract metadata from extracted PDF text
 */
function extractMetadataFromText(text: string, file: File | Buffer): ExtractedMetadata {
  const metadata: ExtractedMetadata = {};
  const textLower = text.toLowerCase();

  // Extract title from filename
  if (file instanceof File) {
    metadata.title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  // Extract dates - look for common date patterns
  const datePatterns = [
    // Look for "DATE:" in fax headers (e.g., "DATE: Mon, 12/08/25")
    /(?:date|DATE)[:\s]+(?:mon|tue|wed|thu|fri|sat|sun)[,\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    // Look for "Date:" label followed by date
    /(?:date|signed|executed|effective|dated)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    // Look for dates with timestamps (e.g., "12/8/2025 14:36:05")
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+\d{1,2}:\d{2}:\d{2}/i,
    // Named months
    /(?:date|signed|executed|effective|dated)[:\s]*(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi,
    // Look for dates near signature area
    /(?:signature|signed)[^:]*[:]?\s*[^\n]*\n[^\n]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    // General date patterns (4-digit year first, then 2-digit)
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2})/g,
  ];

  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Try to parse the first date found
      const dateStr = matches[0];
      const parsedDate = parseDate(dateStr);
      if (parsedDate) {
        metadata.signedDate = parsedDate;
        console.log('PDF extraction - Found signed date:', parsedDate, 'from:', dateStr);
        break;
      }
    }
  }

  // Extract email addresses (case-insensitive search in original text)
  // Look for "Provider Email:" or "Email:" labels first
  const emailLabelPatterns = [
    /(?:provider\s+email|email|contact\s+email)[:\s]+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/i,
    /(?:facility\s+email)[:\s]+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/i,
  ];
  
  let signerEmailFound = false;
  for (const pattern of emailLabelPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const email = match[1].toLowerCase();
      // Skip generic recipient emails
      if (!email.includes('xytex.com') && 
          !email.includes('example.com') && 
          !email.includes('test.com')) {
        metadata.signerEmail = email;
        console.log('PDF extraction - Found signer email from label:', metadata.signerEmail);
        signerEmailFound = true;
        break;
      }
    }
  }
  
  // Fallback: find any email in the text
  if (!signerEmailFound) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
    const emails = text.match(emailPattern);
    if (emails && emails.length > 0) {
      // Prefer emails that might be signer emails (not generic domains)
      const signerEmail = emails.find(email => {
        const emailLower = email.toLowerCase();
        return !emailLower.includes('xytex.com') &&
               !emailLower.includes('example.com') && 
               !emailLower.includes('test.com') &&
               !emailLower.includes('noreply') &&
               !emailLower.includes('no-reply') &&
               !emailLower.includes('donotreply');
      }) || emails[0];
      metadata.signerEmail = signerEmail.toLowerCase();
      console.log('PDF extraction - Found signer email:', metadata.signerEmail);
    }
  }

  // Extract names - look for patterns like "Provider Signature:", "Contact Name:", etc.
  // Search in original text (case-sensitive) for proper name capitalization
  const namePatterns = [
    // Look for "Provider Signature:" or "Signature:" followed by name
    /(?:provider\s+signature|signature|signed\s+by)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    // Look for "Contact Name:" followed by name
    /(?:contact\s+name|name)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    // Look for name after signature line
    /(?:signature|signed)[^:]*[:]?\s*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    // General patterns
    /(?:by|from)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
  ];

  const excludedWords = ['Agreement', 'Contract', 'Document', 'Date', 'Effective', 'Location', 'Address', 'Phone', 'Email', 'Company', 'Corporation', 'Inc', 'LLC', 'Ltd', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Solace', 'Health', 'Practice', 'Provider', 'Facility'];

  for (const pattern of namePatterns) {
    const matchResult = text.match(pattern);
    if (matchResult && matchResult.length > 0) {
      // For patterns with capture groups, matchResult[1] is the captured name
      // For patterns without capture groups, matchResult[0] is the full match
      let name = '';
      
      if (matchResult[1]) {
        // Use captured group (the name part)
        name = matchResult[1].trim();
      } else if (matchResult[0]) {
        // Extract name from full match
        const fullMatch = matchResult[0];
        if (fullMatch.includes(':')) {
          // Pattern like "Provider Signature: Erin Marten"
          const parts = fullMatch.split(':');
          if (parts.length > 1) {
            name = parts[1].trim();
          }
        } else {
          // Extract name using regex
          const nameMatch = fullMatch.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
          if (nameMatch) {
            name = nameMatch[1].trim();
          }
        }
      }
      
      if (name) {
        // Clean up name (remove credentials like "DNP", "MPH", "APRN-CNM", etc.)
        name = name.replace(/,\s*[A-Z]+.*$/, '').trim();
        name = name.replace(/\s+[A-Z]+(-[A-Z]+)*$/, '').trim(); // Remove trailing credentials
        const nameWords = name.split(/\s+/);
        // Check if it's a valid name (2-3 words, not in excluded list)
        if (nameWords.length >= 2 && nameWords.length <= 3) {
          const isExcluded = nameWords.some(word => excludedWords.includes(word));
          if (!isExcluded) {
            metadata.signerName = name;
            console.log('PDF extraction - Found signer name:', metadata.signerName);
            break;
          }
        }
      }
    }
  }

  // If we extracted text but found no metadata, log a sample for debugging
  if (text.length > 0 && !metadata.signedDate && !metadata.signerName && !metadata.signerEmail) {
    console.warn('PDF extraction - Text extracted but no metadata found. Sample text:', text.substring(0, 1000));
    // Try one more pass with more lenient patterns
    if (!metadata.signerEmail) {
      // Look for any email in the text (case-insensitive)
      const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i);
      if (emailMatch) {
        metadata.signerEmail = emailMatch[0].toLowerCase();
        console.log('PDF extraction - Found email with lenient pattern:', metadata.signerEmail);
      }
    }
  }

  return metadata;
}

/**
 * Parse various date formats into YYYY-MM-DD format
 */
function parseDate(dateStr: string): string | undefined {
  try {
    // Remove common prefixes
    const cleanDate = dateStr.replace(/^(?:signed|date|executed|effective)[:\s]+/i, '').trim();
    
    // Try different date formats
    const formats = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/, // MM/DD/YY
    ];

    for (const format of formats) {
      const match = cleanDate.match(format);
      if (match) {
        let year: number, month: number, day: number;
        
        if (match[0].length === 10 && match[0].includes('/')) {
          // Assume MM/DD/YYYY for US format
          month = parseInt(match[1], 10);
          day = parseInt(match[2], 10);
          year = parseInt(match[3], 10);
        } else if (match[0].startsWith('20') || match[0].startsWith('19')) {
          // YYYY/MM/DD format
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10);
          day = parseInt(match[3], 10);
        } else {
          // MM/DD/YY format
          month = parseInt(match[1], 10);
          day = parseInt(match[2], 10);
          year = 2000 + parseInt(match[3], 10);
        }

        // Validate date
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }

    // Try parsing named months
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    const monthMatch = cleanDate.match(new RegExp(`(${monthNames.join('|')})\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i'));
    if (monthMatch) {
      const month = monthNames.indexOf(monthMatch[1].toLowerCase()) + 1;
      const day = parseInt(monthMatch[2], 10);
      const year = parseInt(monthMatch[3], 10);
      
      if (month >= 1 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  } catch (error) {
    console.error('Error parsing date:', error);
  }
  
  return undefined;
}
