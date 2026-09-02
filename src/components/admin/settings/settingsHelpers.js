import { supabase } from '@/lib/supabase';
import { validateField, passwordChangeSchema } from '@/lib/validations';

export function validatePricingTiers(value) {
  for (const tier in value) {
    const globalPrice = value[tier].price;
    const currency = value[tier].currency;
    const regional = value[tier].regional || [];

    for (const region of regional) {
      if (region.price === globalPrice && region.currency === currency) {
        return {
          valid: false,
          error: `Regional price for ${region.country} in ${tier} tier is the same as global price. Please set a different price or remove the override.`,
        };
      }
      if (!region.country || region.price <= 0) {
        return {
          valid: false,
          error: `Invalid regional pricing configuration for ${tier} tier.`,
        };
      }
    }
  }
  return { valid: true };
}

export function hasMissingPasswordFields(data) {
  if (!data.currentPassword) return true;
  if (!data.newPassword) return true;
  if (!data.confirmPassword) return true;
  return false;
}

export function validatePasswordChange(passwordData) {
  if (hasMissingPasswordFields(passwordData)) {
    return { valid: false, error: 'Please fill all password fields' };
  }
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    return { valid: false, error: 'New passwords do not match' };
  }
  const schemaValidation = validateField(
    passwordChangeSchema.shape.newPassword,
    passwordData.newPassword
  );
  if (!schemaValidation.valid) {
    return { valid: false, error: schemaValidation.error };
  }
  return { valid: true };
}

export async function performPasswordUpdate(currentPassword, newPassword) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    throw new Error('Incorrect current password');
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) throw updateError;
}
