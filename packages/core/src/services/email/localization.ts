import {
  getActiveOrganizationPlan,
  getOrganizationById,
  getOrganizationStudentEmailTemplate
} from '@cio/db/queries/organization';
import { DEFAULT_LOCALE, isStudentEmailId, resolveStudentEmailLocale, type EmailLocale } from '@cio/utils/email';
import { PLAN } from '@cio/utils/plans';
import { env } from '@cio/core/config/env';

export async function canCustomizeStudentEmails(organizationId: string): Promise<boolean> {
  if (env.PUBLIC_IS_SELFHOSTED === 'true') return true;

  const activePlan = await getActiveOrganizationPlan(organizationId);
  return (activePlan?.planName ?? PLAN.BASIC) !== PLAN.BASIC;
}

export async function getStudentEmailDeliveryLocale(
  organizationId: string | undefined,
  emailId: string
): Promise<EmailLocale> {
  if (!organizationId || !isStudentEmailId(emailId)) return DEFAULT_LOCALE;

  try {
    const [organization, canCustomize] = await Promise.all([
      getOrganizationById(organizationId),
      canCustomizeStudentEmails(organizationId)
    ]);
    if (!organization) return DEFAULT_LOCALE;

    const language = organization.settings?.language;
    return resolveStudentEmailLocale({
      isEligible: canCustomize,
      enforced: language?.enforced === true,
      locale: language?.locale
    });
  } catch (error) {
    console.error('getStudentEmailDeliveryLocale error:', error);
    return DEFAULT_LOCALE;
  }
}

/**
 * Rechecks the org's entitlement at send time. Entitled orgs keep the queued locale and get their saved template;
 * everyone else, and any failed lookup, gets the English default.
 */
export async function getStudentEmailSendContext(organizationId: string, emailId: string, queuedLocale: EmailLocale) {
  const englishDefault = { locale: DEFAULT_LOCALE, templateOverride: undefined };
  if (!isStudentEmailId(emailId)) return englishDefault;

  try {
    if (!(await canCustomizeStudentEmails(organizationId))) return englishDefault;

    const templateOverride = await getOrganizationStudentEmailTemplate(organizationId, emailId, queuedLocale);
    return { locale: queuedLocale, templateOverride };
  } catch (error) {
    console.error('getStudentEmailSendContext error:', error);
    return englishDefault;
  }
}
