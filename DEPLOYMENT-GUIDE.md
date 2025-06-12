# Family Planning Database Migration - Deployment Guide

## 🎯 Overview
This guide covers the deployment of database schema changes required for the family planning features.

## 📋 Pre-Deployment Checklist

### ✅ Required Files Ready:
- ✅ `migrations/add_family_planning_columns.sql` - Main migration script
- ✅ `migrations/rollback_family_planning_columns.sql` - Rollback script  
- ✅ `test_database_migration.js` - Verification test script
- ✅ Updated TypeScript types in `src/lib/supabase.ts`
- ✅ Updated database service types in `src/services/database.ts`

### ✅ Migration Impact:
- **Tables Modified**: `profiles`, `goals`
- **New Columns**: 5 total
  - `profiles`: `planning_type`, `family_size`
  - `goals`: `initial_amount`, `remaining_amount`, `family_retirement_profile`
- **Downtime**: None (columns added with defaults)
- **Data Loss Risk**: None (additive migration only)

## 🚀 Deployment Steps

### Step 1: Backup Database (5 mins)
```bash
# In Supabase Dashboard:
# 1. Go to Settings > Database
# 2. Create backup snapshot
# 3. Note backup timestamp
```

### Step 2: Apply Migration (2 mins)
```sql
-- Copy and paste migrations/add_family_planning_columns.sql
-- into Supabase SQL Editor and run
```

### Step 3: Verify Migration (3 mins)
```javascript
// Run test_database_migration.js in browser console
// Should see: "🎉 Database Migration Test: PASSED"
```

### Step 4: Deploy Application Code (10 mins)
```bash
# Deploy updated application with new TypeScript types
# Verify family planning features work end-to-end
```

## 🧪 Testing Checklist

### ✅ Database Structure:
- [ ] `profiles.planning_type` column exists with 'individual'/'family' constraint
- [ ] `profiles.family_size` column exists with 1-20 range constraint  
- [ ] `goals.initial_amount` column exists with >= 0 constraint
- [ ] `goals.remaining_amount` column exists
- [ ] `goals.family_retirement_profile` JSONB column exists
- [ ] Indexes created for performance

### ✅ Data Integrity:
- [ ] Existing profiles have default values (individual, size 1)
- [ ] Existing goals have remaining_amount = amount
- [ ] New records can be inserted with family planning fields
- [ ] TypeScript types match database schema

### ✅ Application Features:
- [ ] Family vs individual planning selection works
- [ ] Current savings integration functions properly  
- [ ] Retirement strategy selection saves correctly
- [ ] Goal initial/remaining amounts persist
- [ ] All save/load operations include new fields

## 🔄 Rollback Procedure

### If Migration Fails:
```sql
-- Run migrations/rollback_family_planning_columns.sql
-- This will remove all added columns and indexes
```

### If Application Issues:
```bash
# Revert to previous application version
# Database columns will remain but won't be used
# Can rollback database later if needed
```

## ⚠️ Important Notes

1. **Zero Downtime**: Migration adds columns with defaults - no app downtime
2. **Backward Compatible**: Old app versions will ignore new columns
3. **Forward Compatible**: New columns have sensible defaults
4. **Safe Rollback**: Rollback script removes only added columns
5. **Data Preservation**: Existing data is never modified, only new columns added

## 🎯 Success Criteria

- ✅ Migration script runs without errors
- ✅ All new columns exist with correct constraints
- ✅ Existing data remains intact
- ✅ Test script passes all checks
- ✅ Family planning features work in application
- ✅ Save/load operations persist new data correctly

## 📞 Support

If issues arise during deployment:
1. Check migration test results
2. Verify Supabase connection
3. Review application console for errors
4. Use rollback script if needed
5. Test with simple profile/goal updates first

---

**Last Updated**: December 24, 2024  
**Migration Version**: v1.0  
**Estimated Total Time**: 20 minutes 