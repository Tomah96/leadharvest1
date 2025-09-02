# LeadHarvest Project - Lessons Learned

> **Core Philosophy**: Toyota, not BMW. Simple, reliable solutions that work 95% of the time.

## 🎯 Key Principles

### 1. **First Principle Thinking**
- What's the ACTUAL problem? (Not what seems to be the problem)
- What's the SIMPLEST solution?
- What tools do we ALREADY have?

### 2. **Incremental Debugging**
- Change ONE thing at a time
- Test after EACH change
- Don't delete everything to "start fresh"

### 3. **Toyota vs BMW Approach**

| Toyota (Right) ✅ | BMW (Wrong) ❌ |
|---|---|
| Simple if/else logic | Complex regex patterns |
| Use existing modules | Build custom wrappers |
| Fix the specific problem | Rebuild everything |
| 10 lines of code | 200 lines of code |
| 5-minute fix | 2-hour spiral |

## 📚 Daily Lessons

### [Day 8: The NPM/Supabase Incident](./lessons/day8-toyota-not-bmw.md)
**Problem**: Supabase module hanging on import  
**Wrong Solution**: Delete all node_modules, assume NPM broken, build REST wrapper  
**Right Solution**: Remove ONE module from package.json, use existing pg client  
**Time Wasted**: 2+ hours on a 5-minute problem  
**Key Lesson**: Always try the simplest fix first  

### Future Lessons
- Day 9: (To be documented)
- Day 10: (To be documented)

## 🚨 Red Flags - When to STOP and Reconsider

You're probably overengineering if you:
- Are deleting everything to "start fresh"
- Think core tools (npm, node, git) are "completely broken"
- Are building wrappers/adapters for existing tools
- Need 100+ lines to fix a simple import
- Haven't tried the obvious solution first

**When you see these signs**: STOP. Ask "What's the simplest possible fix?"

## 🛠️ Problem-Solving Checklist

Before taking any action:
1. ✓ What's the EXACT error message?
2. ✓ What's the SMALLEST change that might fix it?
3. ✓ Do we have existing tools that already solve this?
4. ✓ Can this be fixed in < 10 lines of code?
5. ✓ Have I tried the obvious solution?

## 💬 Communication Patterns

### Good Communication ✅
"The X module is failing. Let me try removing just that module and use Y instead."

### Bad Communication ❌
"Everything is broken! Let me rebuild the entire system from scratch!"

## 🏗️ Architecture Decisions

### Prefer:
- Direct database connections over complex ORMs
- Native Node.js modules over heavy frameworks
- Explicit error handling over clever abstractions
- Clear if/else over complex regex

### Avoid:
- Abstractions that hide what's actually happening
- Dependencies that do too much
- "Clean slate" approaches
- Assuming tools are broken

## 📖 Required Reading

Before working on any "blocking" issue:
1. Read this document
2. Read the specific day's lesson if similar issue
3. Try the 5-minute fix before the 2-hour fix

## 🎓 Learning from Mistakes

**It's OK to make mistakes**, but we must:
1. Document what went wrong
2. Identify the simpler solution
3. Share with the team
4. Not repeat the same mistake

## 🚗 Remember: Toyota, Not BMW

- **Reliable** > Clever
- **Simple** > Complex  
- **Working** > Perfect
- **Clear** > Elegant
- **Fast fix** > Complete rewrite

---

*This document is updated after each incident where we overcomplicated a solution.*

**Last Updated**: Day 8 - The NPM/Supabase Incident