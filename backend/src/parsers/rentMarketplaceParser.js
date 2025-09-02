// RentMarketplace email parser
class RentMarketplaceParser {
  static parse(emailContent) {
    try {
      const { subject, body, from, date } = emailContent;
      
      const patterns = {
        // Contact information - often in From header or body
        fromContact: /From:\s*(.+)\s*<(.+@.+)>/i,
        nameEmail: /(.+)\s*<(.+@.+)>/,
        name: /(?:Name|Contact):\s*([^\n<]+)/i,
        firstName: /First Name:\s*([^\n\r]+)/i,  // Added pattern for First Name
        lastName: /Last Name:\s*([^\n\r]+)/i,     // Added pattern for Last Name
        phone: /(?:Phone|Tel|Contact):\s*([\d\s\-\(\)\.]+)/i,
        email: /(?:Email|E-mail):\s*([^\s\n]+@[^\s\n]+)/i,
        
        // Property - often in subject or body
        propertySubject: /(?:interested\s+in|regarding|about|Lead\s+for)\s+(.+)/i,
        property: /(?:Property|Address|Unit):\s*([^\n]+)/i,
        propertyInMessage: /information\s+about\s+([^\n.]+)/i,
        
        // Message content
        message: /(?:Message|Comments?|Inquiry):\s*([^\n]+(?:\n(?!\w+:)[^\n]+)*)/i,
        fullMessage: /(?:writes?|says?|message):\s*["\']?([^"'\n]+(?:\n[^"'\n]+)*)["\']?/i,
        
        // Additional details
        moveDate: /(?:move[\s\-]*in\s*date?|available|move\s+date):\s*([^\n]+)/i,
        budget: /(?:budget|rent\s+range|price):\s*\$?([\d,\-\s]+)/i,
        income: /(?:income|salary|earn):\s*\$?([\d,]+)/i,
        creditScore: /(?:credit\s+score|credit):\s*(\d{3})/i,
        occupants: /(?:occupants|people|residents):\s*(\d+)/i,
        pets: /(?:pets?|animals?):\s*([^\n]+)/i,
        leaseLength: /(?:lease\s+length|lease\s+term):\s*([^\n]+)/i,
        
        // Sometimes includes previous conversation
        replyTo: /(?:In\s+reply\s+to|Re:)/i
      };

      const result = {
        source: 'rentmarketplace',
        parsing_errors: []
      };

      // Extract property from subject first (most reliable for this source)
      const subjectMatch = subject.match(patterns.propertySubject);
      if (subjectMatch) {
        result.property_address = subjectMatch[1].trim();
      } else {
        // Try body patterns
        const propertyMatch = body.match(patterns.property);
        if (propertyMatch) {
          result.property_address = propertyMatch[1].trim();
        } else {
          // Try extracting from message content
          const propertyInMessageMatch = body.match(patterns.propertyInMessage);
          if (propertyInMessageMatch) {
            result.property_address = propertyInMessageMatch[1].trim();
          } else {
            result.parsing_errors.push('Property information not found');
          }
        }
      }

      // Extract contact information - try specific First/Last Name patterns first
      const firstNameMatch = body.match(patterns.firstName);
      const lastNameMatch = body.match(patterns.lastName);
      
      if (firstNameMatch && lastNameMatch) {
        // Found both First Name and Last Name patterns
        result.first_name = firstNameMatch[1].trim();
        result.last_name = lastNameMatch[1].trim();
      } else if (firstNameMatch) {
        // Only found First Name
        result.first_name = firstNameMatch[1].trim();
      } else {
        // Fall back to From header extraction
        const fromMatch = from.match(patterns.nameEmail);
        if (fromMatch) {
          const fullName = fromMatch[1].trim().replace(/"/g, '');
          const email = fromMatch[2].trim();
          
          // Don't use "RentMarketplace" as a name
          if (!fullName.toLowerCase().includes('rentmarketplace')) {
            const nameParts = fullName.split(/\s+/);
            result.first_name = nameParts[0];
            result.last_name = nameParts.slice(1).join(' ') || null;
          }
          result.email = email;
        } else {
          // Try extracting from body
          const bodyFromMatch = body.match(patterns.fromContact);
          if (bodyFromMatch) {
            const fullName = bodyFromMatch[1].trim();
            const email = bodyFromMatch[2].trim();
            
            const nameParts = fullName.split(/\s+/);
            result.first_name = nameParts[0];
            result.last_name = nameParts.slice(1).join(' ') || null;
            result.email = email;
          } else {
            // Try individual patterns
            const nameMatch = body.match(patterns.name);
            if (nameMatch) {
              const fullName = nameMatch[1].trim();
              const nameParts = fullName.split(/\s+/);
              result.first_name = nameParts[0];
              result.last_name = nameParts.slice(1).join(' ') || null;
            }
          }
        }
      }
      
      // Extract email if not already found
      if (!result.email) {
        const emailMatch = body.match(patterns.email);
        if (emailMatch) {
          result.email = emailMatch[1].trim();
        }
      }

      // Extract phone
      const phoneMatch = body.match(patterns.phone);
      if (phoneMatch) {
        result.phone = this.normalizePhone(phoneMatch[1]);
      }

      // Extract message/inquiry details
      let messageContent = null;
      const messageMatch = body.match(patterns.message) || body.match(patterns.fullMessage);
      if (messageMatch) {
        messageContent = messageMatch[1].trim();
      } else {
        // For simple emails, the entire body might be the message
        // Remove common headers and footers
        let cleanBody = body
          .replace(/From:.*$/gm, '')
          .replace(/Sent:.*$/gm, '')
          .replace(/To:.*$/gm, '')
          .replace(/Subject:.*$/gm, '')
          .replace(/Phone:.*$/gm, '')
          .replace(/Email:.*$/gm, '')
          .trim();
        
        if (cleanBody && cleanBody.length > 10) {
          messageContent = cleanBody;
        }
      }

      if (messageContent) {
        result.notes = messageContent;
      }

      // Extract move-in date
      const moveMatch = body.match(patterns.moveDate);
      if (moveMatch) {
        result.move_in_date = this.parseDate(moveMatch[1]);
      }

      // Extract financial information
      const incomeMatch = body.match(patterns.income);
      if (incomeMatch) {
        result.income = parseFloat(incomeMatch[1].replace(/,/g, ''));
      }
      
      const creditMatch = body.match(patterns.creditScore);
      if (creditMatch) {
        result.credit_score = parseInt(creditMatch[1]);
      }
      
      // Extract budget information (if no income found)
      if (!result.income) {
        const budgetMatch = body.match(patterns.budget);
        if (budgetMatch) {
          const budgetStr = budgetMatch[1].replace(/,/g, '');
          const singleNumber = budgetStr.match(/^\$?(\d+)$/);
          if (singleNumber) {
            // Store budget as monthly income approximation
            result.income = parseFloat(singleNumber[1]) * 3; // Rough 3x rent-to-income ratio
          } else {
            const budgetNote = `Budget: $${budgetMatch[1]}`;
            result.notes = result.notes ? `${result.notes} | ${budgetNote}` : budgetNote;
          }
        }
      }
      
      // Extract preference information
      const occupantsMatch = body.match(patterns.occupants);
      if (occupantsMatch) {
        result.occupants = parseInt(occupantsMatch[1]);
      }
      
      const petsMatch = body.match(patterns.pets);
      if (petsMatch) {
        result.pets = petsMatch[1].trim();
      }
      
      const leaseMatch = body.match(patterns.leaseLength);
      if (leaseMatch) {
        result.lease_length = leaseMatch[1].trim();
      }

      // Set inquiry date
      if (date) {
        result.inquiry_date = new Date(date).toISOString();
      }

      // Clean up notes if too long
      if (result.notes && result.notes.length > 500) {
        result.notes = result.notes.substring(0, 497) + '...';
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
        source: 'rentmarketplace',
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
      let cleaned = dateStr.trim();
      
      // Remove ordinal suffixes (1st, 2nd, 3rd, 4th, etc.)
      cleaned = cleaned.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
      
      // Try to parse the date
      const parsed = new Date(cleaned);
      
      if (!isNaN(parsed.getTime())) {
        // If year is not specified, assume current or next year
        const currentYear = new Date().getFullYear();
        if (parsed.getFullYear() < currentYear) {
          parsed.setFullYear(currentYear);
        }
        return parsed.toISOString().split('T')[0];
      }
      
      // If parsing fails, try to extract month and day
      const monthDayMatch = cleaned.match(/(\w+)\s+(\d+)/);
      if (monthDayMatch) {
        const monthStr = monthDayMatch[1];
        const day = parseInt(monthDayMatch[2]);
        const currentYear = new Date().getFullYear();
        const testDate = new Date(`${monthStr} ${day}, ${currentYear}`);
        
        if (!isNaN(testDate.getTime())) {
          // Check if date is in the past, if so use next year
          const today = new Date();
          if (testDate < today) {
            testDate.setFullYear(currentYear + 1);
          }
          return testDate.toISOString().split('T')[0];
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = RentMarketplaceParser;