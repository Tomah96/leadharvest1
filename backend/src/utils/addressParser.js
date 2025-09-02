/**
 * Address Parser Utility
 * Extracts unit numbers from property addresses
 * 
 * Examples:
 * - "646 W Huntingdon St unit 1" → {address: "646 W Huntingdon St", unit: "1"}
 * - "1820 N 17th St #A" → {address: "1820 N 17th St", unit: "A"}
 * - "5914 Tackawanna St, Apt 2B" → {address: "5914 Tackawanna St", unit: "2B"}
 * - "123 Main Street" → {address: "123 Main Street", unit: null}
 */

class AddressParser {
  static parseAddress(fullAddress) {
    if (!fullAddress) return { address: null, unit: null };
    
    // Trim and normalize whitespace
    let address = fullAddress.trim().replace(/\s+/g, ' ');
    let unit = null;
    
    // Pattern 1: "unit X", "apt X", "apartment X", "suite X", "ste X", "room X", "rm X"
    // Case insensitive, captures the unit identifier after the keyword
    const keywordPattern = /\b(?:unit|apt|apartment|suite|ste|room|rm)\s+([A-Za-z0-9]+)\b/i;
    const keywordMatch = address.match(keywordPattern);
    
    if (keywordMatch) {
      unit = keywordMatch[1];
      // Remove the entire unit portion from the address
      address = address.replace(keywordMatch[0], '').trim();
    }
    
    // Pattern 2: "#X" notation (e.g., "#A", "#2B", "#123")
    // Must be at word boundary or end of string
    const hashPattern = /#([A-Za-z0-9]+)(?:\b|$)/;
    const hashMatch = address.match(hashPattern);
    
    if (hashMatch && !unit) {
      unit = hashMatch[1];
      // Remove the # notation from the address
      address = address.replace(hashMatch[0], '').trim();
    }
    
    // Pattern 3: Numbers at the end after a street designation
    // e.g., "123 Main St 408" → unit "408"
    // Only if we haven't found a unit yet and the number is after common street suffixes
    const streetSuffixes = /\b(?:street|st|road|rd|avenue|ave|drive|dr|court|ct|place|pl|boulevard|blvd|lane|ln|way|circle|cir)\b/i;
    if (!unit && streetSuffixes.test(address)) {
      // Look for a standalone number after the street suffix
      const endNumberPattern = new RegExp(
        '(' + streetSuffixes.source + ')\\s+(\\d+[A-Za-z]?)\\s*$', 'i'
      );
      const endNumberMatch = address.match(endNumberPattern);
      
      if (endNumberMatch) {
        unit = endNumberMatch[2];
        // Remove only the unit number, keep the street suffix
        address = address.replace(new RegExp('\\s+' + unit + '\\s*$'), '').trim();
      }
    }
    
    // Clean up any trailing commas or extra punctuation
    address = address.replace(/[,\s]+$/, '').trim();
    
    // If address becomes empty after extraction, use the original
    if (!address && unit) {
      address = fullAddress;
      unit = null;
    }
    
    return {
      address: address || null,
      unit: unit || null
    };
  }
  
  /**
   * Test the parser with known examples
   */
  static test() {
    const testCases = [
      { input: "646 W Huntingdon St unit 1", expected: { address: "646 W Huntingdon St", unit: "1" } },
      { input: "1820 N 17th St #A", expected: { address: "1820 N 17th St", unit: "A" } },
      { input: "5914 Tackawanna St, Apt 2B", expected: { address: "5914 Tackawanna St", unit: "2B" } },
      { input: "123 Main Street", expected: { address: "123 Main Street", unit: null } },
      { input: "456 Oak Avenue Suite 100", expected: { address: "456 Oak Avenue", unit: "100" } },
      { input: "789 Pine Rd 408", expected: { address: "789 Pine Rd", unit: "408" } },
      { input: null, expected: { address: null, unit: null } },
      { input: "", expected: { address: null, unit: null } }
    ];
    
    console.log('\n=== Address Parser Test Results ===\n');
    let passed = 0;
    let failed = 0;
    
    testCases.forEach(({ input, expected }) => {
      const result = this.parseAddress(input);
      const isMatch = JSON.stringify(result) === JSON.stringify(expected);
      
      if (isMatch) {
        console.log(`✅ PASS: "${input}"`);
        console.log(`   Result: ${JSON.stringify(result)}`);
        passed++;
      } else {
        console.log(`❌ FAIL: "${input}"`);
        console.log(`   Expected: ${JSON.stringify(expected)}`);
        console.log(`   Got: ${JSON.stringify(result)}`);
        failed++;
      }
      console.log('');
    });
    
    console.log(`\nTest Summary: ${passed} passed, ${failed} failed\n`);
    return failed === 0;
  }
}

module.exports = AddressParser;

// Run tests if this file is executed directly
if (require.main === module) {
  AddressParser.test();
}