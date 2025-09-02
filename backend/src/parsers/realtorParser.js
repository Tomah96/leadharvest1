// Realtor.com email parser
class RealtorParser {
  static parse(emailContent) {
    try {
      const { subject, body, from, date } = emailContent;
      
      const patterns = {
        // Contact information
        name: /(?:Name|Contact Name|From):\s*([^\n<]+)/i,
        firstName: /First Name:\s*([^\n\r]+)/i,
        lastName: /Last Name:\s*([^\n\r]+)/i,
        phone: /(?:Phone|Telephone|Tel|Mobile|Cell):\s*([\d\s\-\(\)\.]+)/i,
        email: /(?:Email|E-mail):\s*([^\s\n]+@[^\s\n]+)/i,
        
        // Property and inquiry
        property: /(?:Property|Address|Listing):\s*([^\n]+)/i,
        interested: /interested\s+in\s+([^\n\.]+)/i,
        
        // Timing
        timestamp: /(?:Lead\s+received|Inquiry\s+date|Date):\s*([^\n]+)/i,
        moveDate: /(?:Move[^\n]*date?|When[^\n]*move):\s*([^\n]+)/i,
        
        // Message
        message: /(?:Message|Comments?|Notes?):\s*([^\n]+(?:\n(?!\w+:)[^\n]+)*)/i,
        
        // Additional details
        bedrooms: /(?:Bedrooms?|Beds?):\s*(\d+)/i,
        bathrooms: /(?:Bathrooms?|Baths?):\s*(\d+)/i,
        budget: /(?:Budget|Price\s+range):\s*\$?([\d,\-\s]+)/i
      };

      const result = {
        source: 'realtor',
        parsing_errors: []
      };
      
      // Check for "New realtor.com lead - X" pattern in subject first
      const newLeadMatch = subject.match(/New\s+realtor\.com\s+lead\s*[-–]\s*(.+)$/i);
      if (newLeadMatch) {
        // Extract name from subject
        const leadName = newLeadMatch[1].trim();
        const nameParts = leadName.split(/\s+/);
        result.first_name = nameParts[0];
        result.last_name = nameParts.slice(1).join(' ') || null;
      }

      // Extract property information
      let propertyMatch = body.match(patterns.property);
      if (!propertyMatch) {
        // Try to extract from interested pattern
        propertyMatch = body.match(patterns.interested);
        if (!propertyMatch) {
          // Try subject line
          const subjectProperty = subject.match(/(?:regarding|about|for)\s+([^\n,]+)/i);
          if (subjectProperty) {
            result.property = subjectProperty[1].trim();
          } else {
            result.parsing_errors.push('Property information not found');
          }
        } else {
          result.property = propertyMatch[1].trim();
        }
      } else {
        result.property = propertyMatch[1].trim();
      }
      
      // Set property_address same as property
      if (result.property) {
        result.property_address = result.property;
      }

      // Extract contact name from body if not already found in subject
      if (!result.first_name) {
        // Check for explicit First/Last Name patterns first
        const firstNameMatch = body.match(patterns.firstName);
        const lastNameMatch = body.match(patterns.lastName);
        
        if (firstNameMatch && lastNameMatch) {
          result.first_name = firstNameMatch[1].trim();
          result.last_name = lastNameMatch[1].trim();
        } else if (firstNameMatch) {
          result.first_name = firstNameMatch[1].trim();
        } else {
          // Fall back to full name pattern
          const nameMatch = body.match(patterns.name);
          if (nameMatch) {
            const fullName = nameMatch[1].trim().replace(/[<>]/g, '');
            const nameParts = fullName.split(/\s+/);
            result.first_name = nameParts[0];
            result.last_name = nameParts.slice(1).join(' ') || null;
          }
        }
      }

      // Extract phone
      const phoneMatch = body.match(patterns.phone);
      if (phoneMatch) {
        result.phone = this.normalizePhone(phoneMatch[1]);
      } else {
        // Try alternative phone patterns
        const altPhoneMatch = body.match(/\b(\d{3}[\s\-\.]?\d{3}[\s\-\.]?\d{4})\b/);
        if (altPhoneMatch) {
          result.phone = this.normalizePhone(altPhoneMatch[1]);
        }
      }

      // Extract email
      const emailMatch = body.match(patterns.email);
      if (emailMatch) {
        result.email = emailMatch[1].trim();
      }

      // Extract message
      const messageMatch = body.match(patterns.message);
      if (messageMatch) {
        result.notes = messageMatch[1].trim();
      }

      // Extract move date
      const moveMatch = body.match(patterns.moveDate);
      if (moveMatch) {
        result.move_in_date = this.parseDate(moveMatch[1]);
      }

      // Extract bedroom/bathroom preferences
      const bedroomMatch = body.match(patterns.bedrooms);
      const bathroomMatch = body.match(patterns.bathrooms);
      
      if (bedroomMatch || bathroomMatch) {
        let preferences = [];
        if (bedroomMatch) preferences.push(`${bedroomMatch[1]} bedrooms`);
        if (bathroomMatch) preferences.push(`${bathroomMatch[1]} bathrooms`);
        
        if (result.notes) {
          result.notes += ` | Preferences: ${preferences.join(', ')}`;
        } else {
          result.notes = `Preferences: ${preferences.join(', ')}`;
        }
      }

      // Extract budget information
      const budgetMatch = body.match(patterns.budget);
      if (budgetMatch) {
        const budgetStr = budgetMatch[1].replace(/,/g, '');
        // Try to parse as income if it's a single number
        const singleNumber = budgetStr.match(/^\$?(\d+)$/);
        if (singleNumber) {
          result.income = parseFloat(singleNumber[1]);
        } else {
          // Add to notes if it's a range or complex format
          const budgetNote = `Budget: $${budgetMatch[1]}`;
          result.notes = result.notes ? `${result.notes} | ${budgetNote}` : budgetNote;
        }
      }

      // Set inquiry date
      const timestampMatch = body.match(patterns.timestamp);
      if (timestampMatch) {
        result.inquiry_date = this.parseDate(timestampMatch[1]);
      } else if (date) {
        result.inquiry_date = new Date(date).toISOString();
      }

      // Handle missing phone number
      if (!result.phone) {
        // Generate a placeholder phone number
        result.phone = '9999999999';
        result.parsing_errors.push('Phone number not found - using placeholder');
      }

      return result;
    } catch (error) {
      return {
        source: 'realtor',
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
        return parsed.toISOString().split('T')[0];
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = RealtorParser;