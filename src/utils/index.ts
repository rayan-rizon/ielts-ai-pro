export function createPageUrl(pageName: string) {
  if (!pageName) return '/';

  // Special cases where the desired route structure does not follow the default kebab-case pattern
  const specialRoutes: Record<string, string> = {
    AdminPanel: '/admin/panel',
    ForgotPassword: '/forgot-password',
    UpdatePassword: '/update-password',
    StudyGroups: '/study-groups',
    AdminLogin: '/admin/login',
    AdminUserDetails: '/admin/user',
    Index: '/',
    PrivacyPolicy: '/privacy',
    TermsOfService: '/terms',
    Resources: '/resources',
    SignUp: '/signup',
  };
  if (specialRoutes[pageName]) {
    return specialRoutes[pageName];
  }

  // Generic conversion: camelCase / PascalCase / spaced to kebab-case
  const kebab = pageName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // Insert dash before capitals
    .replace(/\s+/g, '-') // Replace spaces with dash
    .toLowerCase()
    .replace(/-+/g, '-'); // Normalize multiple dashes

  return '/' + kebab;
}

// Utility function for combining class names
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
