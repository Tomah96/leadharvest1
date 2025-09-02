# Lead Parsing Summary

## Current Status
You have **201+ processed lead emails** in your Gmail with the label "Processed lead" (Label_16).

## Sample Leads Found

1. **Zillow Leads** (from @convo.zillow.com):
   - "Ernestine is requesting information about 1919 W Diamond St #2, Philadelphia, PA, 19121"
   - "Hritik is requesting information about 253 N 3rd St #4, Philadelphia, PA, 19106"

2. **Realtor.com Leads**:
   - "New realtor.com lead - Gabby Wood"
   - "New realtor.com lead - Mamadou Kouyate"
   - "New realtor.com lead - Odin Sandstrand"

## Parsing Issues

Currently, the system is **not successfully parsing** these leads because:

1. **Email source detection issue**: Emails from `@convo.zillow.com` are not recognized as Zillow emails
2. **Parser patterns don't match**: The parsers expect different email formats than what you're receiving
3. **Missing phone numbers**: The system requires a phone number for deduplication, but it's not finding them in the emails

## What the System Should Extract

From each lead email, we need to extract:
- **Name**: First and last name of the lead
- **Phone**: Required for deduplication (primary key)
- **Email**: Lead's email address
- **Property**: Address they're interested in
- **Source**: zillow, realtor, etc.
- **Additional info**: move-in date, credit score, income, pets, occupants (if available)

## Next Steps

Claude 2 (Backend) has been assigned to:
1. Update the email source detector to recognize @convo.zillow.com
2. Fix the parsers to extract data from your actual email formats
3. Add better error handling and logging

Once fixed, you'll be able to import and parse all 201+ processed leads automatically!