'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  buildDashboardHref,
  normalizeDashboardRange,
  normalizeWebsiteDomain,
  normalizeWebsiteId,
  normalizeWebsiteName,
  DELETE_WEBSITE_CONFIRMATION,
} from '@/lib/websites';

async function requireAdminSession() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function createWebsite(formData: FormData) {
  await requireAdminSession();

  const name = normalizeWebsiteName(formData.get('name'));
  const domain = normalizeWebsiteDomain(formData.get('domain'));
  const range = normalizeDashboardRange(formData.get('range'));

  if (!name || !domain) {
    redirect(buildDashboardHref(null, range));
  }

  let websiteId: string;
  try {
    const website = await prisma.website.create({
      data: { name, domain },
      select: { id: true },
    });
    websiteId = website.id;
  } catch (err) {
    console.error('Failed to create website:', err);
    redirect(buildDashboardHref(null, range));
  }

  revalidatePath('/');
  redirect(buildDashboardHref(websiteId, range));
}

export async function updateWebsite(formData: FormData) {
  await requireAdminSession();

  const websiteId = normalizeWebsiteId(formData.get('websiteId'));
  const name = normalizeWebsiteName(formData.get('name'));
  const domain = normalizeWebsiteDomain(formData.get('domain'));
  const range = normalizeDashboardRange(formData.get('range'));

  if (!websiteId || !name || !domain) {
    redirect(buildDashboardHref(websiteId, range));
  }

  try {
    await prisma.website.update({
      where: { id: websiteId },
      data: { name, domain },
    });
  } catch (err) {
    console.error('Failed to update website:', err);
  }

  revalidatePath('/');
  redirect(buildDashboardHref(websiteId, range));
}

export async function deleteWebsite(formData: FormData) {
  await requireAdminSession();

  const websiteId = normalizeWebsiteId(formData.get('websiteId'));
  const confirmation = formData.get('confirmation');
  const range = normalizeDashboardRange(formData.get('range'));

  if (!websiteId || confirmation !== DELETE_WEBSITE_CONFIRMATION) {
    redirect(buildDashboardHref(websiteId, range));
  }

  const nextWebsite = await prisma.website.findFirst({
    where: { id: { not: websiteId } },
    orderBy: { name: 'asc' },
    select: { id: true },
  });

  try {
    await prisma.website.delete({ where: { id: websiteId } });
  } catch (err) {
    console.error('Failed to delete website:', err);
    redirect(buildDashboardHref(websiteId, range));
  }

  revalidatePath('/');
  redirect(buildDashboardHref(nextWebsite?.id, range));
}
