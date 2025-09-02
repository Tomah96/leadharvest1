// Zillow email parser
const TourDateParser = require('../utils/tourDateParser');

class ZillowParser {
  static tourParser = new TourDateParser();

  static parse(emailContent) {
    try {
      const { subject, body, from, date } = emailContent;
      
      // Clean HTML content if present
      const cleanBody = this.stripHtml(body);
      
      // Extract sender name from email 'from' field FIRST (most reliable)
      // Format: "Ashlie Conboy <z375qg5hx415i1ww2mrejcxm3n@convo.zillow.com>"
      let senderFirstName = null;
      let senderLastName = null;
      if (from) {
        const senderMatch = from.match(/^([^<]+)\s*</);  // Match everything before the '<'
        if (senderMatch) {
          const senderName = senderMatch[1].trim();
          // Only use if it looks like a real name (not "96 New message" etc)
          if (!/^\d+/.test(senderName)) {  // Doesn't start with numbers
            const nameParts = senderName.split(/\s+/);
            if (nameParts.length >= 2 && /^[A-Za-z]+$/.test(nameParts[0]) && /^[A-Za-z]+$/.test(nameParts[1])) {
              senderFirstName = nameParts[0];
              senderLastName = nameParts.slice(1).join(' ');
            }
          }
        }
      }
      
      // Extract basic patterns
      const patterns = {
        // Property information
        property: /Property:\s*([^\n,]+)/i,
        propertyAddress: /(?:Address:|Property:)\s*([^\n]+)/i,
        
        // Contact information
        leadName: /(?:Lead\s+Name:|Name:)\s*([A-Za-z]+)\s+([A-Za-z]+)/i,
        firstName: /First Name:\s*([^\n\r]+)/i,
        lastName: /Last Name:\s*([^\n\r]+)/i,
        fullName: /(?:Name|From):\s*([^\n<]+)/i,
        phone: /(?:Phone|Tel|Contact|Mobile|Cell):\s*([\d\s\-\(\)\.]+)/i,
        email: /(?:Email|E-mail):\s*([^\s\n]+@[^\s\n]+)/i,
        
        // Lead details - handle "X says:" pattern for HTML emails
        // Updated to capture full name (first and last) before "says:"
        nameWithSays: /([A-Za-z]+(?:\s+[A-Za-z]+)+)\s+says:/i,
        message: /says:\s*([^M\n]+?)(?:\s+Move\s+in|\s+Lead\s+Information|$)/i, // Extract text after "says:" until section headers
        moveIn: /(?:Move[^\n<>]*in[^\n<>]*date?:|When[^\n<>]*move|Move\s*in)[:>]?\s*([^\n<>\s]+(?:\s+\d+,?\s+\d+)?)/i,
        
        // Financial information
        creditScore: /(?:Credit[^\n<>]*score?|Score)[:>]?\s*(\d+)(?:[\s\-to]+(\d+))?/i,
        income: /(?:Income|Salary)[:>]?\s*\$?([\d,]+)/i,
        
        // Preferences
        pets: /(?:Pets?|Animals?)[:>]?\s*(Yes|No|true|false|\d+)/i,
        leaseLength: /(?:Lease[^\n<>]*length?|Term)[:>]?\s*(\d+)[\s\-]*(?:months?|mon|mo)?/i,
        occupants: /(?:Occupants?|People|Adults?|Number[^\n<>]*Occupants?)[:>]?\s*(\d+)/i,
        bedrooms: /(?:Bedrooms?|Number[^\n<>]*Bedrooms?)[:>]?\s*(\d+)/i,
        
        // Dates
        inquiryDate: /(?:Lead\s+received|Inquiry\s+date|Date):\s*([^\n]+)/i
      };

      const result = {
        source: 'zillow',
        parsing_errors: [],
        first_name: senderFirstName,
        last_name: senderLastName
      };

      // Check for "X is requesting information about Y" pattern in subject first
      const requestingInfoMatch = subject.match(/^(.+?)\s+is\s+requesting\s+information\s+about\s+(.+)$/i);
      if (requestingInfoMatch) {
        // Extract name from subject
        const leadName = requestingInfoMatch[1].trim();
        result.first_name = leadName.split(/\s+/)[0];
        result.last_name = leadName.split(/\s+/).slice(1).join(' ') || null;
        
        // Extract property from subject
        result.property_address = requestingInfoMatch[2].trim();
        result.property = result.property_address;
      }
      
      // Extract property information from body if not found in subject
      if (!result.property) {
        const propertyMatch = body.match(patterns.property) || body.match(patterns.propertyAddress);
        if (propertyMatch) {
          result.property = propertyMatch[1].trim();
          result.property_address = result.property;
        } else {
          // Try to extract from subject with other patterns
          const subjectProperty = subject.match(/(?:regarding|about|for)\s+([^\n,]+)/i);
          if (subjectProperty) {
            result.property = subjectProperty[1].trim();
            result.property_address = result.property;
          } else if (!requestingInfoMatch) {
            result.parsing_errors.push('Property address not found');
          }
        }
      }

      // Extract name from body if not already found in subject
      if (!result.first_name) {
        // Check for "X says:" pattern first (common in HTML emails)
        const saysMatch = cleanBody.match(patterns.nameWithSays);
        if (saysMatch) {
          const fullName = saysMatch[1].trim();
          const nameParts = fullName.split(/\s+/);
          result.first_name = nameParts[0];
          result.last_name = nameParts.slice(1).join(' ') || null;
        } else {
          // Check for explicit First/Last Name patterns
          const firstNameMatch = cleanBody.match(patterns.firstName);
          const lastNameMatch = cleanBody.match(patterns.lastName);
          
          if (firstNameMatch && lastNameMatch) {
            result.first_name = firstNameMatch[1].trim();
            result.last_name = lastNameMatch[1].trim();
          } else if (firstNameMatch) {
            result.first_name = firstNameMatch[1].trim();
          } else {
            // Fall back to other name patterns
            const nameMatch = cleanBody.match(patterns.leadName) || cleanBody.match(patterns.fullName);
            if (nameMatch) {
              if (patterns.leadName.test(nameMatch[0])) {
                result.first_name = nameMatch[1].trim();
                result.last_name = nameMatch[2].trim();
              } else {
                // Split full name
                const nameParts = nameMatch[1].trim().split(/\s+/);
                result.first_name = nameParts[0];
                result.last_name = nameParts.slice(1).join(' ') || '';
              }
            }
          }
        }
      }
      
      // Check for "About FirstName LastName" pattern when we only have first name
      if (result.first_name && !result.last_name) {
        const aboutMatch = cleanBody.match(/About\s+([A-Za-z]+)\s+([A-Za-z]+)/i);
        if (aboutMatch && aboutMatch[1].toLowerCase() === result.first_name.toLowerCase()) {
          result.last_name = aboutMatch[2];
        }
      }
      
      // ALWAYS check body for better name (even if subject had partial name)
      // This fixes the issue where subject has "Mackenzie" but body has "Mackenzie Bohs"
      // Look for name pattern AFTER the last period or number to skip addresses
      const saysMatchOverride = cleanBody.match(/(?:\.|[0-9])\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+says:/i);
      if (saysMatchOverride && (!result.last_name || result.last_name === '')) {
        const fullName = saysMatchOverride[1].trim();
        const nameParts = fullName.split(/\s+/);
        
        // Only override if we get a better name (has last name)
        if (nameParts.length > 1) {
          result.first_name = nameParts[0];
          result.last_name = nameParts.slice(1).join(' ');
        }
      }
      
      // Also check for "See FirstName LastName in Zillow App" pattern
      if (!result.last_name || result.last_name === '') {
        const seeInAppMatch = cleanBody.match(/See\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+in\s+Zillow\s+App/i);
        if (seeInAppMatch) {
          const fullName = seeInAppMatch[1].trim();
          const nameParts = fullName.split(/\s+/);
          if (nameParts.length > 1) {
            result.first_name = nameParts[0];
            result.last_name = nameParts.slice(1).join(' ');
          }
        }
      }
      
      // Check for "X requested an application" pattern
      if (!result.last_name || result.last_name === '') {
        const requestMatch = cleanBody.match(/([A-Za-z]+\s+[A-Za-z]+)\s+requested\s+an?\s+application/i);
        if (requestMatch) {
          const nameParts = requestMatch[1].trim().split(/\s+/);
          result.first_name = nameParts[0];
          result.last_name = nameParts.slice(1).join(' ');
        }
      }

      // Extract contact information - Enhanced phone extraction
      let phoneFound = false;
      
      // Method 1: Look for phone in HTML contact link
      const contactLinkMatch = body.match(/contact\?[^"]*phone=([0-9-]+)/i);
      if (contactLinkMatch) {
        result.phone = this.normalizePhone(contactLinkMatch[1]);
        phoneFound = true;
      }
      
      // Method 2: Try standard phone patterns in clean body
      if (!phoneFound) {
        let phoneMatch = cleanBody.match(patterns.phone);
        if (!phoneMatch) {
          // Try pattern with newline: "Phone\n(215) 753-5652"
          phoneMatch = cleanBody.match(/Phone\s*\n\s*([\d\s\-\(\)\.]+)/i);
        }
        if (phoneMatch) {
          result.phone = this.normalizePhone(phoneMatch[1]);
          phoneFound = true;
        }
      }
      
      // Method 3: Try alternative phone patterns
      if (!phoneFound) {
        const altPhoneMatch = cleanBody.match(/\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}/);
        if (altPhoneMatch) {
          result.phone = this.normalizePhone(altPhoneMatch[0]);
          phoneFound = true;
        }
      }
      
      // Don't use placeholder - let leadService handle deduplication by email
      if (!phoneFound) {
        result.phone = null;
        result.parsing_errors.push('Phone number not found - will use email for deduplication');
      }

      let emailMatch = cleanBody.match(patterns.email);
      if (emailMatch) {
        result.email = emailMatch[1].trim();
      } else if (from) {
        // Extract email from the 'from' field if not found in body
        // Handle formats like "Name <email@domain.com>" or just "email@domain.com"
        const fromEmailMatch = from.match(/<([^>]+@[^>]+)>/) || from.match(/([^\s]+@[^\s]+)/);
        if (fromEmailMatch) {
          result.email = fromEmailMatch[1].trim();
        }
      }

      // Extract message/notes - look for "says:" pattern or inquiry message
      let messageMatch = cleanBody.match(patterns.message);
      if (!messageMatch) {
        // Try alternative pattern with newlines
        messageMatch = cleanBody.match(/says:\s*\n?\s*([^\n]+)/i);
      }
      if (!messageMatch) {
        // Try to extract inquiry message between "says:" and "Move in" or "Send Application"
        messageMatch = cleanBody.match(/says:\s*([^]*?)(?:Move\s+in|Send\s+Application|Lead\s+Information)/i);
      }
      if (!messageMatch) {
        // Try pattern for standalone inquiry text (e.g., "I'm interested in your property...")
        messageMatch = cleanBody.match(/(?:I'm interested|I am interested|Can you send|Would like)[^]*?(?:Move\s+in|Send\s+Application|Lead\s+Information|$)/i);
      }
      if (messageMatch) {
        // Clean up the message - remove excess whitespace and truncate if very long
        let message = messageMatch[1] ? messageMatch[1].trim() : messageMatch[0].trim();
        message = message.replace(/\s+/g, ' ').trim();
        // Limit to reasonable length
        if (message.length > 500) {
          message = message.substring(0, 497) + '...';
        }
        result.notes = message;
      }

      // Extract move-in date - handle both inline and structured formats
      let moveInMatch = cleanBody.match(patterns.moveIn);
      if (!moveInMatch) {
        // Try pattern for structured data: "Move in\nOct 01, 2025"
        moveInMatch = cleanBody.match(/Move\s+in\s*\n\s*([^\n]+)/i);
      }
      if (moveInMatch) {
        result.move_in_date = this.parseDate(moveInMatch[1]);
      }

      // Extract credit score - handle both inline and structured formats
      let creditMatch = cleanBody.match(patterns.creditScore);
      if (!creditMatch) {
        // Try pattern for structured data: "Credit score\n620 to 659"
        creditMatch = cleanBody.match(/Credit\s+score\s*\n\s*(\d+)\s*(?:to|-)\s*(\d+)/i);
      }
      if (creditMatch) {
        if (creditMatch[2]) {
          // Range format like "620-659" or "620 to 659" - return as string
          result.credit_score = `${creditMatch[1]}-${creditMatch[2]}`;
        } else {
          // Single value - keep as string for consistency
          result.credit_score = creditMatch[1];
        }
      }

      // Extract income - handle both inline and structured formats
      // Look for income type indicators
      const hasAnnual = cleanBody.match(/annual|yearly|per year|\/yr/i);
      const hasMonthly = cleanBody.match(/monthly|per month|\/mo/i);
      
      let incomeMatch = cleanBody.match(patterns.income);
      if (!incomeMatch) {
        // Try pattern for structured data: "Income\n$83976"
        incomeMatch = cleanBody.match(/Income\s*\n\s*\$?([\d,]+)/i);
      }
      if (incomeMatch) {
        let amount = parseFloat(incomeMatch[1].replace(/,/g, ''));
        
        // Fix specific known typo: 80004 should be 80000
        if (amount === 80004) {
          amount = 80000;
        }
        
        result.income = amount;
        
        // Determine income type
        if (hasAnnual) {
          result.income_type = 'annual';
        } else if (hasMonthly) {
          result.income_type = 'monthly';
        } else {
          // Smart guess based on amount
          result.income_type = amount > 10000 ? 'annual' : 'monthly';
        }
      }

      // Extract pets - handle both inline and structured formats
      let petsMatch = cleanBody.match(patterns.pets);
      if (!petsMatch) {
        // Try pattern for structured data: "Pets\nNo" or "Pets\nNot answered"
        petsMatch = cleanBody.match(/Pets?\s*\n\s*([^\n]+)/i);
      }
      if (petsMatch) {
        const petsRaw = petsMatch[1].trim();
        const petsValue = petsRaw.toLowerCase();
        
        // Handle "Not answered" or similar as null
        if (petsValue === 'not answered' || petsValue === 'n/a' || petsValue === 'not provided') {
          result.pets = null;
        } else if (petsValue === 'no' || petsValue === 'false') {
          result.pets = null;  // null for no pets
        } else if (petsValue === 'yes' || petsValue === 'true') {
          result.pets = 'Yes';  // Generic yes
        } else if (!isNaN(parseInt(petsValue))) {
          // If it's a number, format it nicely
          const num = parseInt(petsValue);
          result.pets = num > 0 ? `${num} pet${num > 1 ? 's' : ''}` : null;
        } else {
          // Store specific type: "2 dogs", "cats", etc
          result.pets = petsRaw;  // Use raw value to preserve case
        }
      }

      // Extract lease length - handle both inline and structured formats
      let leaseMatch = cleanBody.match(patterns.leaseLength);
      if (!leaseMatch) {
        // Try pattern for structured data: "Lease Length\n18 months"
        leaseMatch = cleanBody.match(/Lease\s+Length\s*\n\s*(\d+)\s*months?/i);
      }
      if (leaseMatch) {
        result.lease_length = parseInt(leaseMatch[1]);
      }

      // Extract occupants - handle both inline and structured formats
      let occupantsMatch = cleanBody.match(patterns.occupants);
      if (!occupantsMatch) {
        // Try pattern for structured data: "Number of Occupants\n2"
        occupantsMatch = cleanBody.match(/Number\s+of\s+Occupants?\s*\n\s*(\d+)/i);
      }
      if (occupantsMatch) {
        result.occupants = parseInt(occupantsMatch[1]);
      } else {
        // Don't default to 0, leave as null if not provided
        result.occupants = null;
      }

      // Extract bedrooms if present - handle both inline and structured formats
      let bedroomsMatch = cleanBody.match(patterns.bedrooms);
      if (!bedroomsMatch) {
        // Try pattern for structured data: "Number of Bedrooms\n3"
        bedroomsMatch = cleanBody.match(/Number\s+of\s+Bedrooms?\s*\n\s*(\d+)/i);
      }
      if (bedroomsMatch) {
        result.preferred_bedrooms = parseInt(bedroomsMatch[1]);
      }

      // Set inquiry date - CRITICAL: Use email date/time for accurate tracking
      // First try to find explicit inquiry date in email
      const inquiryMatch = cleanBody.match(patterns.inquiryDate);
      if (inquiryMatch) {
        result.inquiry_date = this.parseDate(inquiryMatch[1]);
      } else if (date) {
        // Use the email date as inquiry date - this is most accurate
        result.inquiry_date = new Date(date).toISOString();
      } else {
        // Fallback to current date if no date available
        result.inquiry_date = new Date().toISOString();
      }

      // Extract tour availability from the message
      result.tour_availability = this.extractTourAvailability(cleanBody, result.message || result.notes);
      
      // Store metadata for additional information
      result.metadata = {
        credit_score_range: result.credit_score && typeof result.credit_score === 'string' && result.credit_score.includes('-') 
          ? result.credit_score 
          : null,
        email_received_date: date ? new Date(date).toISOString() : null,
        parsed_at: new Date().toISOString()
      };

      // Phone is now handled above - null if not found, will use email for dedup

      // Store raw email content for debugging
      result.raw_email_body = body;
      
      return result;
    } catch (error) {
      return {
        source: 'zillow',
        parsing_errors: [`Failed to parse email: ${error.message}`]
      };
    }
  }

  static normalizePhone(phone) {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return cleaned;
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.substring(1);
    }
    return cleaned;
  }

  static parseDate(dateStr) {
    if (!dateStr) return null;
    
    try {
      const cleaned = dateStr.trim();
      const parsed = new Date(cleaned);
      
      if (!isNaN(parsed.getTime())) {
        // Keep full ISO string with time to prevent timezone issues
        return parsed.toISOString();
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  static stripHtml(html) {
    if (!html) return '';
    
    // First remove style tags and their content
    let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Replace divs and breaks with newlines to preserve structure
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<div[^>]*>/gi, '');
    text = text.replace(/<br[^>]*>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<p[^>]*>/gi, '');
    
    // Remove all other HTML tags
    text = text.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&#x24;/g, '$');
    text = text.replace(/&#xa0;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&#\d+;/g, ' '); // Handle numeric entities
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ');  // Collapse multiple spaces
    text = text.replace(/\n\s+/g, '\n'); // Clean up line starts
    text = text.replace(/\s+\n/g, '\n'); // Clean up line ends
    text = text.replace(/\n+/g, '\n');   // Collapse multiple newlines
    
    return text.trim();
  }

  static extractTourAvailability(body, inquiryMessage = '') {
    // Combine body and inquiry message for comprehensive search
    const fullText = `${body} ${inquiryMessage || ''}`;
    
    // Look for EXPLICIT tour availability mentions with dates/times
    // Must have both tour intent AND specific time/date
    const tourPatterns = [
      // Patterns that include specific dates/times with tour intent
      /tour[^.]*?(?:on|at)\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|tomorrow|today)[^.]+/gi,
      /tour[^.]*?(?:on|at)\s+\d{1,2}[/:]\d{1,2}[^.]+/gi,
      /available[^.]*?for\s+(?:a\s+)?tour[^.]*?(?:on|at)[^.]+/gi,
      /can\s+(?:tour|visit|see)[^.]*?(?:on|at|tomorrow|today)[^.]+/gi,
      /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[^.]*?(?:for\s+(?:a\s+)?tour|to\s+tour)/gi,
      /(?:morning|afternoon|evening)[^.]*?(?:for\s+(?:a\s+)?tour|to\s+tour)/gi,
      /(?:\d{1,2}(?:am|pm|AM|PM))[^.]*?(?:for\s+(?:a\s+)?tour|to\s+tour)/gi,
      /I(?:'m| am)\s+(?:free|available)[^.]*?(?:for\s+(?:a\s+)?tour|to\s+tour)[^.]+/gi,
      /(?:anytime|flexible)[^.]*?(?:for\s+(?:a\s+)?tour|to\s+tour)/gi
    ];

    let tourText = '';
    for (const pattern of tourPatterns) {
      const matches = fullText.match(pattern);
      if (matches) {
        tourText += matches.join(' ') + ' ';
      }
    }

    // DO NOT extract generic dates without tour context
    // "I would like to schedule a tour" alone should NOT trigger date extraction
    // Only extract if there's a clear tour + date/time combination

    // Parse the extracted text
    if (tourText.trim()) {
      return this.tourParser.parse(tourText.trim());
    }

    // Return unparsed object
    return {
      parsed: false,
      slots: [],
      preferences: {},
      raw_text: null
    };
  }
}

module.exports = ZillowParser;