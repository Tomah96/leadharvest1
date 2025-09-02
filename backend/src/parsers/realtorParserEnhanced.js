// Enhanced Realtor.com email parser with JSON support
class RealtorParser {
  static parse(emailContent) {
    try {
      const { subject, body, from, date } = emailContent;
      
      const result = {
        source: 'realtor',
        parsing_errors: []
      };

      // First, try to extract name from subject (New realtor.com lead - Name)
      const subjectLeadMatch = subject.match(/New\s+realtor\.com\s+lead\s*[-–]\s*(.+)$/i);
      if (subjectLeadMatch) {
        const leadName = subjectLeadMatch[1].trim();
        const nameParts = leadName.split(/\s+/);
        result.first_name = nameParts[0];
        result.last_name = nameParts.slice(1).join(' ') || null;
        console.log(`[RealtorParser] Extracted name from subject: ${result.first_name} ${result.last_name}`);
      }

      // Clean and decode the body (handle quoted-printable encoding)
      let decodedBody = body
        .replace(/=\r?\n/g, '')  // Remove soft line breaks
        .replace(/=([A-Fa-f0-9]{2})/g, (m, p1) => String.fromCharCode(parseInt(p1, 16)))  // Decode hex
        .replace(/\\"/g, '"')  // Fix escaped quotes
        .replace(/\s+/g, ' ');  // Normalize whitespace

      // Try to extract JSON data (Realtor.com sends prospect data as JSON)
      const jsonPatterns = [
        /\{[\s\S]*?"firstName"[\s\S]*?\}/i,  // Look for firstName field
        /\{[\s\S]*?"firstname"[\s\S]*?\}/i,  // Alternative casing
        /\{[\s\S]*?"email"[\s\S]*?"phone"[\s\S]*?\}/i,  // Look for email and phone
        /prospect["\s]*:["\s]*(\{[\s\S]*?\})/i,  // prospect object
      ];

      let prospectData = null;
      for (const pattern of jsonPatterns) {
        const jsonMatch = decodedBody.match(pattern);
        if (jsonMatch) {
          try {
            // Extract and clean the JSON string
            let jsonString = jsonMatch[jsonMatch.length - 1] || jsonMatch[0];
            
            // Fix common JSON formatting issues
            jsonString = jsonString
              .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')  // Add quotes to keys
              .replace(/:\s*undefined/g, ': null')  // Replace undefined with null
              .replace(/:\s*'([^']*)'/g, ': "$1"')  // Replace single quotes with double
              .trim();

            // Ensure it starts and ends with braces
            if (!jsonString.startsWith('{')) jsonString = '{' + jsonString;
            if (!jsonString.endsWith('}')) {
              // Find the last valid closing brace
              const lastBrace = jsonString.lastIndexOf('}');
              if (lastBrace > 0) {
                jsonString = jsonString.substring(0, lastBrace + 1);
              } else {
                jsonString += '}';
              }
            }

            console.log(`[RealtorParser] Attempting to parse JSON: ${jsonString.substring(0, 200)}...`);
            prospectData = JSON.parse(jsonString);
            console.log(`[RealtorParser] Successfully parsed JSON prospect data`);
            break;
          } catch (err) {
            console.log(`[RealtorParser] JSON parse attempt failed: ${err.message}`);
            continue;
          }
        }
      }

      // Extract data from JSON if found
      if (prospectData) {
        // Name (if not already extracted from subject)
        if (!result.first_name) {
          result.first_name = prospectData.firstName || prospectData.firstname || prospectData.first_name || '';
          result.last_name = prospectData.lastName || prospectData.lastname || prospectData.last_name || '';
        }

        // Contact info
        result.email = prospectData.email || null;
        
        // Phone - clean it up
        if (prospectData.phone) {
          result.phone = this.normalizePhone(prospectData.phone);
        }

        // Build comments from available fields
        const commentFields = [];
        
        if (prospectData.moveDate || prospectData.move_date) {
          commentFields.push(`Move Date: ${prospectData.moveDate || prospectData.move_date}`);
        }
        if (prospectData.bedrooms) {
          commentFields.push(`Bedrooms: ${prospectData.bedrooms}`);
        }
        if (prospectData.occupants) {
          commentFields.push(`Occupants: ${prospectData.occupants}`);
        }
        if (prospectData.leaseTerm || prospectData.lease_term) {
          commentFields.push(`Lease Term: ${prospectData.leaseTerm || prospectData.lease_term}`);
        }
        if (prospectData.minBudget || prospectData.min_budget) {
          commentFields.push(`Min Budget: ${prospectData.minBudget || prospectData.min_budget}`);
        }
        if (prospectData.maxBudget || prospectData.max_budget) {
          commentFields.push(`Max Budget: ${prospectData.maxBudget || prospectData.max_budget}`);
        }
        if (prospectData.message) {
          commentFields.push(`Message: ${prospectData.message}`);
        }

        if (commentFields.length > 0) {
          result.notes = commentFields.join('\n');
        }

        // Extract move-in date specifically
        if (prospectData.moveDate || prospectData.move_date) {
          result.move_in_date = prospectData.moveDate || prospectData.move_date;
        }
      }

      // Fallback: Try to extract data using text patterns if JSON parsing failed
      if (!prospectData || !result.email) {
        console.log('[RealtorParser] Falling back to pattern-based extraction');
        
        const patterns = {
          email: /(?:Email|E-mail):\s*([^\s\n]+@[^\s\n]+)/i,
          phone: /(?:Phone|Telephone|Tel|Mobile|Cell):\s*([\d\s\-\(\)\.]+)/i,
          firstName: /First Name:\s*([^\n\r]+)/i,
          lastName: /Last Name:\s*([^\n\r]+)/i,
          property: /(?:Property|Address|Listing):\s*([^\n]+)/i,
          moveDate: /(?:Move[^\n]*date?|When[^\n]*move):\s*([^\n]+)/i,
        };

        // Extract email if not found
        if (!result.email) {
          const emailMatch = decodedBody.match(patterns.email) || 
                            decodedBody.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,6}/);
          if (emailMatch) {
            result.email = emailMatch[1] || emailMatch[0];
          }
        }

        // Extract phone if not found
        if (!result.phone) {
          const phoneMatch = decodedBody.match(patterns.phone) ||
                           decodedBody.match(/\b(\+?\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/);
          if (phoneMatch) {
            result.phone = this.normalizePhone(phoneMatch[1] || phoneMatch[0]);
          }
        }

        // Extract name if not found
        if (!result.first_name) {
          const firstNameMatch = decodedBody.match(patterns.firstName);
          const lastNameMatch = decodedBody.match(patterns.lastName);
          
          if (firstNameMatch) result.first_name = firstNameMatch[1].trim();
          if (lastNameMatch) result.last_name = lastNameMatch[1].trim();
        }

        // Extract property address
        const propertyMatch = decodedBody.match(patterns.property) ||
                            decodedBody.match(/property["']?[^>]*content=["']([^"']+)/i);
        if (propertyMatch) {
          result.property_address = propertyMatch[1].trim();
        }
      }

      // Look for property address in meta tags or special markers
      if (!result.property_address) {
        const propertyPatterns = [
          /lead_property_address["'\s]*:["'\s]*([^"',\n]+)/i,
          /property_address["'\s]*:["'\s]*([^"',\n]+)/i,
          /listing_address["'\s]*:["'\s]*([^"',\n]+)/i,
        ];

        for (const pattern of propertyPatterns) {
          const match = decodedBody.match(pattern);
          if (match) {
            result.property_address = match[1].trim();
            break;
          }
        }
      }

      // Set defaults for required fields
      result.first_name = result.first_name || '';
      result.last_name = result.last_name || '';

      // Log what we extracted
      console.log('[RealtorParser] Extracted data:', {
        name: `${result.first_name} ${result.last_name}`.trim(),
        email: result.email,
        phone: result.phone,
        property: result.property_address,
        hasNotes: !!result.notes
      });

      // Add parsing error if we couldn't extract critical information
      if (!result.email && !result.phone) {
        result.parsing_errors.push('Could not extract contact information (email or phone)');
      }

      return result;
    } catch (error) {
      console.error('[RealtorParser] Fatal parsing error:', error);
      return {
        source: 'realtor',
        parsing_errors: [`Fatal parsing error: ${error.message}`],
        first_name: '',
        last_name: ''
      };
    }
  }

  static normalizePhone(phone) {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    const cleaned = phone.toString().replace(/\D/g, '');
    
    // Take last 10 digits for US phone numbers
    if (cleaned.length >= 10) {
      return cleaned.slice(-10);
    }
    
    return cleaned || null;
  }
}

module.exports = RealtorParser;