const moment = require('moment-timezone');

class TourDateParser {
  constructor(timezone = 'America/New_York') {
    this.timezone = timezone;
    this.patterns = {
      // Date patterns
      slashDate: /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g,
      writtenDate: /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/gi,
      
      // Time patterns
      time12Hour: /(\d{1,2}):?(\d{0,2})?\s*(am|pm|AM|PM)/g,
      time24Hour: /(\d{1,2}):(\d{2})(?::(\d{2}))?/g,
      timeWords: /(morning|afternoon|evening|noon|midnight)/gi,
      
      // Relative dates
      relativeDays: /(today|tomorrow|yesterday)/gi,
      weekdays: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
      relativeWeeks: /(this|next)\s+(week|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
      
      // Ranges
      dateRange: /(\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})\/(\d{1,2})/g,
      dayRange: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*-\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi
    };
  }

  /**
   * Main parsing function
   * @param {string} text - Raw text containing tour availability
   * @returns {Object} Structured tour availability object
   */
  parse(text) {
    if (!text) {
      return {
        parsed: false,
        slots: [],
        preferences: {},
        raw_text: text
      };
    }

    const slots = [];
    const preferences = {
      preferred_days: [],
      preferred_times: [],
      avoid_times: []
    };

    // Extract dates
    const dates = this.extractDates(text);
    const times = this.extractTimes(text);
    
    // Combine dates and times intelligently
    if (dates.length > 0) {
      dates.forEach((date, index) => {
        const slot = {
          date: date.date.format('YYYY-MM-DD'),
          confidence: date.confidence || 0.8
        };
        
        // Try to match times with dates
        if (times.length > index) {
          slot.time = times[index].value;
          slot.time_confidence = times[index].confidence;
        }
        
        slots.push(slot);
      });
    } else if (times.length > 0) {
      // Just times without dates - could be general availability
      times.forEach(time => {
        slots.push({
          time: time.value,
          time_confidence: time.confidence
        });
      });
    }

    // Extract preferences
    preferences.preferred_days = this.extractPreferredDays(text);
    preferences.preferred_times = this.extractPreferredTimes(text);

    return {
      parsed: slots.length > 0 || preferences.preferred_days.length > 0,
      slots,
      preferences,
      raw_text: text
    };
  }

  extractDates(text) {
    const dates = [];
    let match;
    const currentYear = moment().year();
    const currentMonth = moment().month() + 1; // 0-indexed

    // Reset regex lastIndex
    this.patterns.slashDate.lastIndex = 0;
    
    // Slash dates (8/4, 08/04/2025)
    while ((match = this.patterns.slashDate.exec(text)) !== null) {
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      let year = currentYear;
      
      if (match[3]) {
        year = match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3]);
      } else {
        // If month is less than current month, assume next year
        if (month < currentMonth) {
          year = currentYear + 1;
        }
      }
      
      if (month <= 12 && day <= 31) {
        // Use proper date format with zero-padding
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const date = moment.tz(dateStr, 'YYYY-MM-DD', this.timezone);
        if (date.isValid()) {
          dates.push({
            date,
            confidence: 0.95
          });
        }
      }
    }

    // Written dates (August 4th, Aug 4)
    this.patterns.writtenDate.lastIndex = 0;
    while ((match = this.patterns.writtenDate.exec(text)) !== null) {
      const monthName = match[1];
      const day = parseInt(match[2]);
      const year = match[3] || currentYear;
      
      const date = moment.tz(`${monthName} ${day}, ${year}`, 'MMMM D, YYYY', this.timezone);
      if (!date.isValid()) {
        // Try short month format
        const shortDate = moment.tz(`${monthName} ${day}, ${year}`, 'MMM D, YYYY', this.timezone);
        if (shortDate.isValid()) {
          dates.push({
            date: shortDate,
            confidence: 0.9
          });
        }
      } else {
        dates.push({
          date,
          confidence: 0.9
        });
      }
    }

    // Relative dates (tomorrow, next Monday)
    this.patterns.relativeDays.lastIndex = 0;
    while ((match = this.patterns.relativeDays.exec(text)) !== null) {
      const relative = match[1].toLowerCase();
      let date;
      
      switch(relative) {
        case 'today':
          date = moment.tz(this.timezone);
          break;
        case 'tomorrow':
          date = moment.tz(this.timezone).add(1, 'day');
          break;
        case 'yesterday':
          date = moment.tz(this.timezone).subtract(1, 'day');
          break;
      }
      
      if (date && date.isValid()) {
        dates.push({
          date,
          confidence: 0.85
        });
      }
    }

    // Next/This + weekday (next Monday, this Friday)
    this.patterns.relativeWeeks.lastIndex = 0;
    while ((match = this.patterns.relativeWeeks.exec(text)) !== null) {
      const modifier = match[1].toLowerCase(); // this/next
      const target = match[2].toLowerCase(); // week/weekend/monday/etc
      let date;

      if (target === 'week') {
        date = moment.tz(this.timezone).add(modifier === 'next' ? 1 : 0, 'week').startOf('week');
      } else if (target === 'weekend') {
        date = moment.tz(this.timezone).add(modifier === 'next' ? 1 : 0, 'week').day(6); // Saturday
      } else {
        // It's a weekday name
        const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(target);
        if (targetDay !== -1) {
          date = moment.tz(this.timezone);
          const currentDay = date.day();
          
          if (modifier === 'next') {
            // Next occurrence of this day
            date.add(1, 'week').day(targetDay);
          } else {
            // This week's occurrence
            if (targetDay > currentDay) {
              date.day(targetDay);
            } else {
              date.add(1, 'week').day(targetDay);
            }
          }
        }
      }

      if (date && date.isValid()) {
        dates.push({
          date,
          confidence: 0.8
        });
      }
    }

    return dates;
  }

  extractTimes(text) {
    const times = [];
    let match;

    // Reset regex lastIndex
    this.patterns.time12Hour.lastIndex = 0;
    
    // 12-hour times (2pm, 2:30 PM)
    while ((match = this.patterns.time12Hour.exec(text)) !== null) {
      const hour = parseInt(match[1]);
      const minute = match[2] || '00';
      const meridiem = match[3].toUpperCase();
      
      let hour24 = hour;
      if (meridiem === 'PM' && hour !== 12) hour24 += 12;
      if (meridiem === 'AM' && hour === 12) hour24 = 0;
      
      times.push({
        value: `${hour24.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`,
        confidence: 0.95
      });
    }

    // 24-hour times without AM/PM
    this.patterns.time24Hour.lastIndex = 0;
    while ((match = this.patterns.time24Hour.exec(text)) !== null) {
      // Make sure it's not already matched by 12-hour pattern
      const beforeMatch = text.slice(Math.max(0, match.index - 10), match.index);
      const afterMatch = text.slice(match.index + match[0].length, match.index + match[0].length + 5);
      
      // Skip if this is part of a date or has AM/PM
      if (!/\d\//.test(beforeMatch) && !/\/\d/.test(afterMatch) && !/\s*(am|pm)/i.test(afterMatch)) {
        const hour = parseInt(match[1]);
        const minute = match[2];
        
        if (hour < 24 && parseInt(minute) < 60) {
          times.push({
            value: `${hour.toString().padStart(2, '0')}:${minute}`,
            confidence: 0.8
          });
        }
      }
    }

    // Time words (morning, afternoon)
    this.patterns.timeWords.lastIndex = 0;
    while ((match = this.patterns.timeWords.exec(text)) !== null) {
      const timeWord = match[1].toLowerCase();
      times.push({
        value: timeWord,
        confidence: 0.7
      });
    }

    return times;
  }

  extractPreferredDays(text) {
    const days = [];
    let match;

    // Reset regex lastIndex
    this.patterns.weekdays.lastIndex = 0;
    
    // Weekday mentions
    while ((match = this.patterns.weekdays.exec(text)) !== null) {
      const day = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      if (!days.includes(day)) {
        days.push(day);
      }
    }

    // Check for "weekdays" or "weekends"
    if (/weekdays/i.test(text)) {
      days.push('weekdays');
    }
    if (/weekend/i.test(text)) {
      days.push('weekends');
    }

    return days;
  }

  extractPreferredTimes(text) {
    const times = [];
    
    if (/morning/i.test(text)) times.push('morning');
    if (/afternoon/i.test(text)) times.push('afternoon');
    if (/evening/i.test(text)) times.push('evening');
    
    // After X time patterns
    const afterMatch = text.match(/after\s+(\d{1,2})\s*(am|pm)?/i);
    if (afterMatch) {
      const hour = afterMatch[1];
      const meridiem = afterMatch[2] || 'pm';
      times.push(`after ${hour}${meridiem.toLowerCase()}`);
    }
    
    // Before X time patterns
    const beforeMatch = text.match(/before\s+(\d{1,2})\s*(am|pm)?/i);
    if (beforeMatch) {
      const hour = beforeMatch[1];
      const meridiem = beforeMatch[2] || 'pm';
      times.push(`before ${hour}${meridiem.toLowerCase()}`);
    }

    return times;
  }

  /**
   * Format a parsed availability object into a human-readable string
   */
  formatAvailability(availability) {
    if (!availability || !availability.parsed) {
      return 'No availability specified';
    }

    const parts = [];
    
    // Format specific slots
    if (availability.slots && availability.slots.length > 0) {
      const slotStrings = availability.slots.map(slot => {
        if (slot.date && slot.time) {
          return `${this.formatDate(slot.date)} at ${this.formatTime(slot.time)}`;
        } else if (slot.date) {
          return this.formatDate(slot.date);
        } else if (slot.time) {
          return this.formatTime(slot.time);
        }
        return '';
      }).filter(s => s);
      
      if (slotStrings.length > 0) {
        parts.push(slotStrings.join(' or '));
      }
    }

    // Add preferences
    if (availability.preferences) {
      if (availability.preferences.preferred_days && availability.preferences.preferred_days.length > 0) {
        parts.push(`Preferred days: ${availability.preferences.preferred_days.join(', ')}`);
      }
      if (availability.preferences.preferred_times && availability.preferences.preferred_times.length > 0) {
        parts.push(`Preferred times: ${availability.preferences.preferred_times.join(', ')}`);
      }
    }

    return parts.join('. ') || availability.raw_text || 'No availability specified';
  }

  formatDate(date) {
    if (!date) return '';
    const d = moment(date);
    if (!d.isValid()) return date;
    
    return d.format('dddd, MMMM Do');
  }

  formatTime(time) {
    if (!time) return '';
    
    // Check if it's already a word like "morning", "afternoon"
    if (['morning', 'afternoon', 'evening', 'noon', 'midnight'].includes(time)) {
      return time;
    }
    
    // Check if it's a special format like "after 5pm"
    if (time.includes('after') || time.includes('before')) {
      return time;
    }
    
    // Convert 24h to 12h format
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = hours >= 12 ? 'pm' : 'am';
      const h12 = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      
      if (minutes === '00') {
        return `${h12}${ampm}`;
      }
      return `${h12}:${minutes}${ampm}`;
    }
    
    return time;
  }
}

module.exports = TourDateParser;