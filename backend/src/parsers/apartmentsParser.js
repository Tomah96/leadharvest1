// Apartments.com email parser
class ApartmentsParser {
  static parse(emailContent) {
    try {
      const { subject, body, from, date } = emailContent;
      
      const patterns = {
        // Contact information
        name: /(?:Name|Contact|Renter):\s*([^\n<]+)/i,
        firstName: /First Name:\s*([^\n\r]+)/i,
        lastName: /Last Name:\s*([^\n\r]+)/i,
        phone: /(?:Phone|Tel|Contact\s+Phone):\s*([\d\s\-\(\)\.]+)/i,
        email: /(?:Email|E-mail|Contact\s+Email):\s*([^\s\n]+@[^\s\n]+)/i,
        
        // Property information
        property: /(?:Property|Unit|Apartment):\s*([^\n]+)/i,
        propertyAddress: /(?:Property\s+Address|Address):\s*([^\n]+)/i,
        propertyLink: /(https?:\/\/[^\s]+apartments\.com[^\s]*)/i,
        
        // Rental details
        beds: /(?:Bedrooms?|Beds?):\s*(\d+|Studio|NA)/i,
        baths: /(?:Bathrooms?|Baths?):\s*(\d+(?:\.\d+)?)/i,
        rent: /(?:Rent|Price):\s*\$?([\d,]+)/i,
        
        // Timeline
        moveDate: /(?:Move[\s\-]*in[\s\-]*date?|Desired\s+move|When.*move):\s*([^\n]+)/i,
        submitted: /(?:Lead\s+Submitted|Application\s+Date|Date):\s*([^\n]+)/i,
        
        // Preferences
        message: /(?:Message|Comments?|Special\s+requests?):\s*([^\n]+(?:\n(?!\w+:)[^\n]+)*)/i,
        pets: /(?:Pets?|Animals?):\s*([^\n]+)/i,
        
        // Additional details
        income: /(?:Income|Salary):\s*\$?([\d,]+)/i,
        employment: /(?:Employment|Employer|Job):\s*([^\n]+)/i
      };

      const result = {
        source: 'apartments',
        parsing_errors: []
      };

      // Extract contact name - check for explicit First/Last Name patterns first
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

      // Extract phone
      const phoneMatch = body.match(patterns.phone);
      if (phoneMatch) {
        result.phone = this.normalizePhone(phoneMatch[1]);
      }

      // Extract email
      const emailMatch = body.match(patterns.email);
      if (emailMatch) {
        result.email = emailMatch[1].trim();
      }

      // Extract property information
      let propertyMatch = body.match(patterns.propertyAddress);
      if (propertyMatch) {
        result.property = propertyMatch[1].trim();
        
        // Don't use "NA" as property address
        if (result.property.toUpperCase() === 'NA') {
          result.property = null;
        }
      }
      
      // If no valid property from propertyAddress pattern, try other sources
      if (!result.property) {
        // Try specific pattern for "Property Address 1:"
        const propAddr1Match = body.match(/Property\s+Address\s+1:\s*([^\n]+)/i);
        if (propAddr1Match && propAddr1Match[1].trim() && propAddr1Match[1].trim().toUpperCase() !== 'NA') {
          result.property = propAddr1Match[1].trim();
        } else {
          // Try to extract from subject
          const subjectProperty = subject.match(/(?:regarding|about|for)\s+([^\n,]+)/i);
          if (subjectProperty) {
            result.property = subjectProperty[1].trim();
          } else {
            // Try pattern "To: <address>"
            const toMatch = body.match(/To:\s*([^\n]+)/i);
            if (toMatch && toMatch[1].trim() && toMatch[1].trim().toUpperCase() !== 'NA') {
              result.property = toMatch[1].trim();
            } else {
              result.parsing_errors.push('Property information not found');
            }
          }
        }
      }

      // Extract property link for additional context
      const linkMatch = body.match(patterns.propertyLink);
      if (linkMatch) {
        if (result.notes) {
          result.notes += ` | Property Link: ${linkMatch[1]}`;
        } else {
          result.notes = `Property Link: ${linkMatch[1]}`;
        }
      }

      // Extract bedroom/bathroom preferences
      const bedsMatch = body.match(patterns.beds);
      const bathsMatch = body.match(patterns.baths);
      
      let preferences = [];
      if (bedsMatch) {
        const beds = bedsMatch[1].toLowerCase();
        if (beds === 'studio') {
          preferences.push('Studio');
        } else if (beds !== 'na') {
          preferences.push(`${beds} bedrooms`);
        }
      }
      if (bathsMatch) {
        preferences.push(`${bathsMatch[1]} bathrooms`);
      }

      // Extract rent information
      const rentMatch = body.match(patterns.rent);
      if (rentMatch) {
        preferences.push(`Rent: $${rentMatch[1]}`);
      }

      if (preferences.length > 0) {
        const prefNote = `Preferences: ${preferences.join(', ')}`;
        result.notes = result.notes ? `${result.notes} | ${prefNote}` : prefNote;
      }

      // Extract move-in date
      const moveMatch = body.match(patterns.moveDate);
      if (moveMatch) {
        result.move_in_date = this.parseDate(moveMatch[1]);
      }

      // Extract message
      const messageMatch = body.match(patterns.message);
      if (messageMatch) {
        const message = messageMatch[1].trim();
        result.notes = result.notes ? `${result.notes} | Message: ${message}` : message;
      }

      // Extract pets information
      const petsMatch = body.match(patterns.pets);
      if (petsMatch) {
        const petsInfo = petsMatch[1].toLowerCase().trim();
        if (petsInfo === 'yes' || petsInfo === 'true' || petsInfo.includes('dog') || petsInfo.includes('cat')) {
          result.pets = true;
        } else if (petsInfo === 'no' || petsInfo === 'false' || petsInfo === 'none') {
          result.pets = false;
        }
        
        // Add detailed pet info to notes
        const petNote = `Pets: ${petsMatch[1]}`;
        result.notes = result.notes ? `${result.notes} | ${petNote}` : petNote;
      }

      // Extract income
      const incomeMatch = body.match(patterns.income);
      if (incomeMatch) {
        result.income = parseFloat(incomeMatch[1].replace(/,/g, ''));
      }

      // Extract employment
      const employmentMatch = body.match(patterns.employment);
      if (employmentMatch) {
        const empNote = `Employment: ${employmentMatch[1]}`;
        result.notes = result.notes ? `${result.notes} | ${empNote}` : empNote;
      }

      // Set inquiry date
      const submittedMatch = body.match(patterns.submitted);
      if (submittedMatch) {
        result.inquiry_date = this.parseDate(submittedMatch[1]);
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
        source: 'apartments',
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

module.exports = ApartmentsParser;