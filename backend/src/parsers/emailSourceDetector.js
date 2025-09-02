// Email source detection patterns
const EMAIL_SOURCES = {
  zillow: {
    senderPatterns: ['@zillow.com', '@convo.zillow.com', 'zillow rental manager', 'noreply@zillow.com'],
    subjectPatterns: ['new lead', 'rental inquiry', 'has expressed interest', 'is requesting information about'],
    identifier: 'zillow'
  },
  realtor: {
    senderPatterns: ['@realtor.com', '@email.realtor.com', 'move.com', '@move.com'],
    subjectPatterns: ['new lead from realtor.com', 'inquiry from realtor', 'new realtor.com lead'],
    identifier: 'realtor'
  },
  apartments: {
    senderPatterns: ['leads@apartments.com', '@apartments.com', 'apartmentlist', '@apartmentlist.com'],
    subjectPatterns: ['new rental lead', 'inquiry', 'rental application'],
    identifier: 'apartments'
  },
  rentmarketplace: {
    senderPatterns: ['@rentmarketplace.com', '@rentals.com'],
    subjectPatterns: ['interested in', 'rental inquiry'],
    identifier: 'rentmarketplace'
  }
};

class EmailSourceDetector {
  static detectSource(emailData) {
    const { from, subject, body } = emailData;
    const fromLower = from.toLowerCase();
    const subjectLower = subject.toLowerCase();

    // Log detection attempt for debugging
    if (fromLower.includes('realtor')) {
      console.log('[EmailSourceDetector] Potential Realtor.com email:', from);
    }
    if (fromLower.includes('apartments')) {
      console.log('[EmailSourceDetector] Potential Apartments.com email:', from);
    }

    // Priority check: Check sender patterns first (more reliable than subject)
    for (const [sourceKey, config] of Object.entries(EMAIL_SOURCES)) {
      const matchesSender = config.senderPatterns.some(pattern => 
        fromLower.includes(pattern.toLowerCase())
      );

      if (matchesSender) {
        // Log successful detection
        if (config.identifier === 'realtor') {
          console.log('[EmailSourceDetector] ✅ Detected Realtor.com email from:', from);
        }
        if (config.identifier === 'apartments') {
          console.log('[EmailSourceDetector] ✅ Detected Apartments.com email from:', from);
        }
        return config.identifier;
      }
    }

    // Fallback: Check subject patterns if no sender match
    for (const [sourceKey, config] of Object.entries(EMAIL_SOURCES)) {
      const matchesSubject = config.subjectPatterns.some(pattern => 
        subjectLower.includes(pattern.toLowerCase())
      );

      if (matchesSubject) {
        // Log successful detection
        if (config.identifier === 'realtor') {
          console.log('[EmailSourceDetector] ✅ Detected Realtor.com email from subject');
        }
        return config.identifier;
      }
    }

    // Log unknown sources that might be Realtor.com
    if (fromLower.includes('realtor') || subjectLower.includes('realtor')) {
      console.log('[EmailSourceDetector] ⚠️ Unrecognized Realtor email:', from, '| Subject:', subject);
    }

    return 'unknown';
  }

  static isKnownSource(source) {
    return Object.keys(EMAIL_SOURCES).includes(source);
  }

  static getSupportedSources() {
    return Object.keys(EMAIL_SOURCES);
  }
}

module.exports = EmailSourceDetector;